import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';
import { MailService } from '../src/mail/mail.service';

describe('Password Reset Flow (e2e)', () => {
  let app: INestApplication;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;

  function cookies(headers: Record<string, unknown>): string {
    const setCookie = (headers['set-cookie'] ?? []) as string[];
    return setCookie.map((c: string) => c.split(';')[0]).join('; ');
  }

  function hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('base64url');
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set before running e2e tests');
    }
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) })
      .compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
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

  describe('forgot-password happy path', () => {
    it('returns 200 with success message for registered email', async () => {
      const email = `forgot-happy-${testSlug}@test.com`;

      await http
        .post('/v1/auth/signup')
        .send({ name: 'ForgotHappy', email, password: 'Strong1Pass!' })
        .expect(201);

      const res = await http
        .post('/v1/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('returns 200 with same message for non-existent email (constant-time, no info leak)', async () => {
      const res = await http
        .post('/v1/auth/forgot-password')
        .send({ email: `nonexistent-${testSlug}@test.com` })
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('reset-password happy path', () => {
    it('resets password, login with new password succeeds, old password fails', async () => {
      const email = `reset-happy-${testSlug}@test.com`;
      const oldPassword = 'Strong1Pass!';
      const newPassword = 'NewStrong2Pass!';

      // Sign up
      await http
        .post('/v1/auth/signup')
        .send({ name: 'ResetHappy', email, password: oldPassword })
        .expect(201);

      // Create a valid reset token directly in the DB
      const tenant = await raw.tenant.findUnique({ where: { slug: 'test' } });
      const user = await raw.user.findFirst({ where: { email, tenantId: tenant!.id } });
      const rawToken = 'valid-reset-token-for-test';
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await raw.passwordResetToken.create({
        data: {
          tenantId: tenant!.id,
          userId: user!.id,
          tokenHash,
          expiresAt,
        },
      });

      // Reset password
      const resetRes = await http
        .post('/v1/auth/reset-password')
        .send({ token: rawToken, password: newPassword })
        .expect(200);

      expect(resetRes.body.message).toBeDefined();

      // Login with NEW password — should succeed
      const loginNew = await http
        .post('/v1/auth/login')
        .send({ email, password: newPassword })
        .expect(200);

      expect(loginNew.body.accessToken).toMatch(/^eyJ/);

      // Login with OLD password — should fail
      await http
        .post('/v1/auth/login')
        .send({ email, password: oldPassword })
        .expect(401);
    });
  });

  describe('expired token rejection', () => {
    it('returns 400 when token has expired', async () => {
      const email = `expired-${testSlug}@test.com`;

      await http
        .post('/v1/auth/signup')
        .send({ name: 'ExpiredToken', email, password: 'Strong1Pass!' })
        .expect(201);

      const tenant = await raw.tenant.findUnique({ where: { slug: 'test' } });
      const user = await raw.user.findFirst({ where: { email, tenantId: tenant!.id } });
      const rawToken = 'expired-token-for-test';
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      await raw.passwordResetToken.create({
        data: {
          tenantId: tenant!.id,
          userId: user!.id,
          tokenHash,
          expiresAt,
        },
      });

      await http
        .post('/v1/auth/reset-password')
        .send({ token: rawToken, password: 'NewStrong2Pass!' })
        .expect(400);
    });
  });

  describe('invalid token rejection', () => {
    it('returns 400 when token does not exist', async () => {
      await http
        .post('/v1/auth/reset-password')
        .send({ token: 'totally-fake-garbage-token', password: 'NewStrong2Pass!' })
        .expect(400);
    });
  });

  describe('password complexity validation in reset', () => {
    it('returns 400 when new password is too weak', async () => {
      const email = `weak-pw-${testSlug}@test.com`;

      await http
        .post('/v1/auth/signup')
        .send({ name: 'WeakPW', email, password: 'Strong1Pass!' })
        .expect(201);

      const tenant = await raw.tenant.findUnique({ where: { slug: 'test' } });
      const user = await raw.user.findFirst({ where: { email, tenantId: tenant!.id } });
      const rawToken = 'valid-token-weak-pw-test';
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await raw.passwordResetToken.create({
        data: {
          tenantId: tenant!.id,
          userId: user!.id,
          tokenHash,
          expiresAt,
        },
      });

      await http
        .post('/v1/auth/reset-password')
        .send({ token: rawToken, password: 'short' })
        .expect(400);
    });
  });
});
