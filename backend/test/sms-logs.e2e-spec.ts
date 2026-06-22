import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('SMS Logs (e2e)', () => {
  let app: INestApplication;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;
  let jar: string;
  let workspaceId: string;
  let apiKey: string;

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
    testSlug = `test-smslog-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const signup = await http
      .post('/v1/auth/signup')
      .send({ name: 'SMS Logs Admin', email: `smslog-${testSlug}@test.com`, password: 'Strong1Pass!' })
      .expect(201);
    jar = cookies(signup.headers);

    const wsRes = await http
      .post('/v1/workspaces')
      .set('Cookie', jar)
      .send({ name: 'Test Workspace' })
      .expect(201);
    workspaceId = wsRes.body.id;

    await http
      .post('/v1/keywords')
      .set('Cookie', jar)
      .send({ word: 'OTP', matchMode: 'CONTAINS', workspaceId })
      .expect(201);

    const codeRes = await http
      .post('/v1/claim-codes')
      .set('Cookie', jar)
      .send({ ttlMinutes: 15, workspaceId })
      .expect(201);

    const claimRes = await http
      .post('/v1/claim-codes/claim')
      .send({ code: codeRes.body.code, publicKey: 'sms-test-key' })
      .expect(200);

    apiKey = claimRes.body.apiKey;

    // Ingest an SMS to create an SmsLog entry
    await http
      .post('/v1/sms')
      .set('Authorization', `Bearer ${apiKey}`)
      .send({
        sender: '+1234567890',
        message: 'Your OTP is 123456',
        smsId: `sms-${testSlug}-001`,
        timestamp: new Date().toISOString(),
      })
      .expect(201);
  });

  afterEach(async () => {
    await raw.smsLog.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.keyword.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.device.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.claimCode.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.tenant.deleteMany({ where: { slug: 'test' } });
  });

  describe('AC-1: list SMS logs', () => {
    it('returns 200 with array of logs after ingesting an SMS', async () => {
      const res = await http
        .get('/v1/sms-logs')
        .set('Cookie', jar)
        .expect(200);

      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AC-2: empty list for new tenant', () => {
    it('returns 200 with empty array when no SMS has been ingested', async () => {
      // Sign up a brand-new tenant with no SMS ingestion
      const freshSlug = `test-smslog-empty-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Empty Tenant', email: `empty-${freshSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const freshJar = cookies(signup.headers);

      const res = await http
        .get('/v1/sms-logs')
        .set('Cookie', freshJar)
        .expect(200);

      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs).toHaveLength(0);
    });
  });

  describe('AC-3: logs contain expected fields', () => {
    it('returns logs with id, sender, message, matchedKeyword, status, receivedAt', async () => {
      const res = await http
        .get('/v1/sms-logs')
        .set('Cookie', jar)
        .expect(200);

      expect(res.body.logs.length).toBeGreaterThanOrEqual(1);

      const log = res.body.logs[0];
      expect(log.id).toBeDefined();
      expect(typeof log.id).toBe('string');
      expect(log.sender).toBeDefined();
      expect(typeof log.sender).toBe('string');
      expect(log.message).toBeDefined();
      expect(typeof log.message).toBe('string');
      expect(log.matchedKeyword).toBeDefined();
      expect(typeof log.matchedKeyword).toBe('string');
      expect(log.status).toBeDefined();
      expect(typeof log.status).toBe('string');
      expect(log.receivedAt).toBeDefined();
    });
  });
});
