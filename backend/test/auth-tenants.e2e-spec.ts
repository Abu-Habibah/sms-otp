import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { TenantScopedPrismaService } from '../src/common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint 1 â€” Auth + Tenants (e2e)', () => {
  let app: INestApplication;
  let prisma: TenantScopedPrismaService;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;

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
    // cookie-parser is required for the JWT guard (reads req.cookies.jwt)
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
    testSlug = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  });

  afterEach(async () => {
    await raw.tenant.deleteMany({ where: { slug: 'test' } });
  });

  describe('AC-1: signup happy path', () => {
    it('creates tenant + user, returns 201, sets cookies', async () => {
      const res = await http
        .post('/v1/auth/signup')
        .send({ name: 'Alice', email: `alice-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      expect(res.body.accessToken).toMatch(/^eyJ/);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('AC-2: login happy path', () => {
    it('returns 200, sets cookies', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Bob', email: `bob-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      const jar = cookies(signup.headers);

      const res = await http
        .post('/v1/auth/login')
        .set('Cookie', jar)
        .send({ email: `bob-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('AC-3: /v1/me with valid JWT', () => {
    it('returns the user and tenant', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Carol', email: `carol-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      const jar = cookies(signup.headers);

      const me = await http
        .get('/v1/me')
        .set('Cookie', jar)
        .expect(200);
      expect(me.body.user.email).toBe(`carol-${testSlug}@test.com`);
      // Slug is derived from email domain: test.com -> test
      expect(me.body.tenant.slug).toBe('test');
    });
  });

  describe('AC-4: unauthenticated request to protected endpoint', () => {
    it('returns 401', async () => {
      await http.get('/v1/me').expect(401);
    });
  });

  describe('AC-5: cross-tenant access', () => {
    it('returns 404 on a different tenant id', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Dave', email: `dave-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      const jar = cookies(signup.headers);

      await http
        .get('/v1/tenants/00000000-0000-0000-0000-000000000000')
        .set('Cookie', jar)
        .expect(404);
    });
  });

  describe('AC-6: passwords are bcrypt-hashed', () => {
    it('stored hash is not the plaintext', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Eve', email: `eve-${testSlug}@test.com`, password: 'Strong1Pass!' });
      expect(signup.status).toBe(201);
      // Slug is derived from email domain: test.com -> test
      const tenant = await raw.tenant.findUnique({ where: { slug: 'test' } });
      const user = await raw.user.findFirst({ where: { tenantId: tenant!.id } });
      expect(user!.passwordHash).not.toBe('Strong1Pass!');
      expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('AC-9: cross-tenant write', () => {
    it('PATCH /v1/tenants/:other-tenant returns 404', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Frank', email: `frank-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      const jar = cookies(signup.headers);

      await http
        .patch('/v1/tenants/00000000-0000-0000-0000-000000000000')
        .set('Cookie', jar)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('AC-12: tenant isolation regression test', () => {
    it('a raw query without tenant context throws', async () => {
      await expect(prisma.user.findMany()).rejects.toThrow(/tried to read\/write.*without a tenant context/);
    });
  });

  describe('AC-13: refresh-token rotation', () => {
    it('refresh issues new token, old refresh token is revoked', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Grace', email: `grace-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      const jar = cookies(signup.headers);
      const oldRefreshCookie = jar.split(';').find((c) => c.trim().startsWith('refresh_jwt='));

      const refresh1 = await http
        .post('/v1/auth/refresh')
        .set('Cookie', jar)
        .expect(200);
      expect(refresh1.body.accessToken).toMatch(/^eyJ/);

      const newJar = cookies(refresh1.headers);
      const newRefreshCookie = newJar.split(';').find((c) => c.trim().startsWith('refresh_jwt='));
      expect(newRefreshCookie).toBeDefined();
      expect(newRefreshCookie).not.toBe(oldRefreshCookie);

      await http
        .post('/v1/auth/refresh')
        .set('Cookie', jar)
        .expect(401);
    });
  });
});




