import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint 3 — Keywords (e2e)', () => {
  let app: INestApplication;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;
  let jar: string;
  let workspaceId: string;

  function cookies(headers: Record<string, unknown>): string {
    const setCookie = (headers['set-cookie'] ?? []) as string[];
    return setCookie.map((c: string) => c.split(';')[0]).join('; ');
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set before running e2e tests');
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    raw = app.get(RawPrismaService);
    http = request(app.getHttpServer());
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    testSlug = `test-sp3-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const signup = await http
      .post('/v1/auth/signup')
      .send({ name: 'Keyword Admin', email: `kw-${testSlug}@test.com`, password: 'Strong1Pass!' })
      .expect(201);
    jar = cookies(signup.headers);

    const wsRes = await http
      .post('/v1/workspaces')
      .set('Cookie', jar)
      .send({ name: 'Test Workspace' })
      .expect(201);
    workspaceId = wsRes.body.id;
  });

  afterEach(async () => {
    await raw.keyword.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.tenant.deleteMany({ where: { slug: 'test' } });
  });

  describe('AC-1: create keyword happy path', () => {
    it('creates a keyword with CONTAINS mode', async () => {
      const res = await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'OTP', matchMode: 'CONTAINS', workspaceId })
        .expect(201);

      expect(res.body.word).toBe('OTP');
      expect(res.body.matchMode).toBe('CONTAINS');
      expect(res.body.enabled).toBe(true);
      expect(res.body.id).toBeDefined();
    });
  });

  describe('AC-2: list keywords', () => {
    it('returns all keywords for the tenant', async () => {
      await http.post('/v1/keywords').set('Cookie', jar).send({ word: 'OTP', workspaceId }).expect(201);
      await http.post('/v1/keywords').set('Cookie', jar).send({ word: 'CODE', workspaceId }).expect(201);

      const res = await http
        .get('/v1/keywords')
        .set('Cookie', jar)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('AC-3: duplicate keyword rejection', () => {
    it('returns 409 on duplicate word', async () => {
      await http.post('/v1/keywords').set('Cookie', jar).send({ word: 'OTP', workspaceId }).expect(201);

      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'OTP', workspaceId })
        .expect(409);
    });
  });

  describe('AC-4: word length validation', () => {
    it('rejects word shorter than 2 chars', async () => {
      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'A', workspaceId })
        .expect(400);
    });

    it('rejects word longer than 50 chars', async () => {
      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'A'.repeat(51), workspaceId })
        .expect(400);
    });
  });

  describe('AC-5: regex validation', () => {
    it('accepts valid regex', async () => {
      const res = await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: '\\d{6}', matchMode: 'REGEX', workspaceId })
        .expect(201);

      expect(res.body.matchMode).toBe('REGEX');
    });

    it('rejects invalid regex', async () => {
      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: '[invalid', matchMode: 'REGEX', workspaceId })
        .expect(400);
    });
  });

  describe('AC-6: toggle enable/disable', () => {
    it('toggles keyword enabled status', async () => {
      const create = await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'OTP', workspaceId })
        .expect(201);

      expect(create.body.enabled).toBe(true);

      const toggle = await http
        .patch(`/v1/keywords/${create.body.id}/toggle`)
        .set('Cookie', jar)
        .expect(200);

      expect(toggle.body.enabled).toBe(false);

      const toggleAgain = await http
        .patch(`/v1/keywords/${create.body.id}/toggle`)
        .set('Cookie', jar)
        .expect(200);

      expect(toggleAgain.body.enabled).toBe(true);
    });
  });

  describe('AC-7: update keyword', () => {
    it('updates word and matchMode', async () => {
      const create = await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'OTP', matchMode: 'CONTAINS', workspaceId })
        .expect(201);

      const update = await http
        .patch(`/v1/keywords/${create.body.id}`)
        .set('Cookie', jar)
        .send({ word: 'CODE', matchMode: 'EXACT' })
        .expect(200);

      expect(update.body.word).toBe('CODE');
      expect(update.body.matchMode).toBe('EXACT');
    });
  });

  describe('AC-8: delete keyword', () => {
    it('deletes a keyword', async () => {
      const create = await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'OTP', workspaceId })
        .expect(201);

      await http
        .delete(`/v1/keywords/${create.body.id}`)
        .set('Cookie', jar)
        .expect(200);

      await http
        .get(`/v1/keywords/${create.body.id}`)
        .set('Cookie', jar)
        .expect(404);
    });
  });

  describe('AC-9: not found', () => {
    it('returns 404 for non-existent keyword', async () => {
      await http
        .get('/v1/keywords/00000000-0000-0000-0000-000000000000')
        .set('Cookie', jar)
        .expect(404);
    });
  });

  describe('AC-10: all match modes', () => {
    it('creates keywords with all match modes', async () => {
      const modes = ['EXACT', 'CONTAINS', 'REGEX', 'AT_START', 'AT_END'];
      for (const mode of modes) {
        const word = mode === 'REGEX' ? '\\d+' : `WORD_${mode}`;
        await http
          .post('/v1/keywords')
          .set('Cookie', jar)
          .send({ word, matchMode: mode, workspaceId })
          .expect(201);
      }

      const res = await http.get('/v1/keywords').set('Cookie', jar).expect(200);
      expect(res.body.length).toBe(5);
    });
  });
});
