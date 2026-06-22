import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { TenantScopedPrismaService } from '../src/common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Tenant Isolation Regression (e2e)', () => {
  let app: INestApplication;
  let prisma: TenantScopedPrismaService;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;

  function cookies(headers: Record<string, unknown>): string {
    const setCookie = (headers['set-cookie'] ?? []) as string[];
    return setCookie.map((c: string) => c.split(';')[0]).join('; ');
  }

  async function createWorkspace(jar: string): Promise<string> {
    const res = await http
      .post('/v1/workspaces')
      .set('Cookie', jar)
      .send({ name: 'Test Workspace' })
      .expect(201);
    return res.body.id;
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
    prisma = app.get(TenantScopedPrismaService);
    raw = app.get(RawPrismaService);
    http = request(app.getHttpServer());
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    testSlug = `test-iso-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  });

  afterEach(async () => {
    await raw.smsLog.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.keyword.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.device.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.claimCode.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.tenant.deleteMany({ where: { slug: { in: ['test', 'other'] } } });
  });

  describe('AC-1: raw Prisma query without tenant context throws', () => {
    it('findMany on TenantScopedPrismaService rejects without tenant context', async () => {
      await expect(prisma.user.findMany()).rejects.toThrow(
        /tried to read\/write.*without a tenant context/,
      );
    });
  });

  describe('AC-2: device from Tenant A not accessible via Tenant B JWT', () => {
    it('GET /v1/devices/:deviceId with Tenant B jar returns 404', async () => {
      // Tenant A: signup, workspace, claim code, claim device
      const signupA = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant A', email: `iso-a-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarA = cookies(signupA.headers);
      const workspaceIdA = await createWorkspace(jarA);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jarA)
        .send({ ttlMinutes: 15, workspaceId: workspaceIdA })
        .expect(201);

      const claimRes = await http
        .post('/v1/claim-codes/claim')
        .send({ code: codeRes.body.code, publicKey: 'iso-test-key-a' })
        .expect(200);
      const deviceId = claimRes.body.device.id;

      // Tenant B: signup (different email domain → different tenant)
      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `iso-b-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);

      // Tenant B tries to access Tenant A's device → 404
      await http
        .get(`/v1/devices/${deviceId}`)
        .set('Cookie', jarB)
        .expect(404);
    });
  });

  describe('AC-3: keyword from Tenant A not visible to Tenant B', () => {
    it('GET /v1/keywords with Tenant B jar does not include Tenant A keywords', async () => {
      // Tenant A: signup, workspace, create keyword
      const signupA = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant A', email: `iso-a-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarA = cookies(signupA.headers);
      const workspaceIdA = await createWorkspace(jarA);

      const kwRes = await http
        .post('/v1/keywords')
        .set('Cookie', jarA)
        .send({ word: 'SECRET_OTP', matchMode: 'CONTAINS', workspaceId: workspaceIdA })
        .expect(201);
      const keywordId = kwRes.body.id;

      // Tenant B: signup (different email domain → different tenant)
      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `iso-b-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);

      // Tenant B lists keywords — Tenant A's keyword should NOT appear
      const listB = await http
        .get('/v1/keywords')
        .set('Cookie', jarB)
        .expect(200);

      expect(Array.isArray(listB.body.keywords)).toBe(true);
      const stolen = listB.body.keywords.find((kw: { id: string }) => kw.id === keywordId);
      expect(stolen).toBeUndefined();
    });
  });

  describe('AC-4: SMS log from Tenant A not visible to Tenant B', () => {
    it('GET /v1/sms-logs with Tenant B jar does not include Tenant A logs', async () => {
      // Tenant A: signup, workspace, keyword, claim device, ingest SMS
      const signupA = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant A', email: `iso-a-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarA = cookies(signupA.headers);
      const workspaceIdA = await createWorkspace(jarA);

      await http
        .post('/v1/keywords')
        .set('Cookie', jarA)
        .send({ word: 'OTP', matchMode: 'CONTAINS', workspaceId: workspaceIdA })
        .expect(201);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jarA)
        .send({ ttlMinutes: 15, workspaceId: workspaceIdA })
        .expect(201);

      const claimRes = await http
        .post('/v1/claim-codes/claim')
        .send({ code: codeRes.body.code, publicKey: 'iso-test-key-sms' })
        .expect(200);
      const apiKeyA = claimRes.body.apiKey;

      // Ingest SMS via Tenant A's device
      await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKeyA}`)
        .send({
          sender: '+1234567890',
          message: 'Your OTP is 999999',
          smsId: `sms-iso-${testSlug}`,
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      // Tenant B: signup, workspace
      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `iso-b-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);
      await createWorkspace(jarB);

      // Tenant B lists SMS logs — should NOT see Tenant A's log
      const listB = await http
        .get('/v1/sms-logs')
        .set('Cookie', jarB)
        .expect(200);

      expect(Array.isArray(listB.body.logs)).toBe(true);
      const stolenLog = listB.body.logs.find(
        (log: { smsId: string }) => log.smsId === `sms-iso-${testSlug}`,
      );
      expect(stolenLog).toBeUndefined();
    });
  });
});
