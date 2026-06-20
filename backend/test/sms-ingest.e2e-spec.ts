import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint 4 — SMS Ingest (e2e)', () => {
  let app: INestApplication;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;
  let jar: string;
  let workspaceId: string;
  let deviceId: string;
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
    testSlug = `test-sp4-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const signup = await http
      .post('/v1/auth/signup')
      .send({ name: 'SMS Admin', email: `sms-${testSlug}@test.com`, password: 'Strong1Pass!' })
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

    const me = await http
      .get('/v1/me')
      .set('Cookie', jar)
      .expect(200);
    const tenantId = me.body.user.tenantId;

    await http
      .patch(`/v1/tenants/${tenantId}`)
      .set('Cookie', jar)
      .send({ forwardUrl: 'https://webhook.example.com/sms' })
      .expect(200);

    const codeRes = await http
      .post('/v1/claim-codes')
      .set('Cookie', jar)
      .send({ ttlMinutes: 15, workspaceId })
      .expect(201);

    const claimRes = await http
      .post('/v1/claim-codes/claim')
      .send({ code: codeRes.body.code, publicKey: 'test-key' })
      .expect(200);

    deviceId = claimRes.body.device.id;
    apiKey = claimRes.body.apiKey;
  });

  afterEach(async () => {
    await raw.smsLog.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.keyword.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.device.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.claimCode.deleteMany({ where: { tenant: { slug: 'test' } } });
    await raw.tenant.deleteMany({ where: { slug: 'test' } });
  });

  describe('AC-1: ingest with keyword match', () => {
    it('creates SmsLog entry when keyword matches', async () => {
      const res = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'Your OTP code is 123456',
          smsId: 'sms-001',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.smsId).toBe('sms-001');
      expect(res.body.matched).toBe(true);
      expect(res.body.matchedKeyword).toBe('OTP');
      expect(res.body.status).toBe('PENDING');
    });
  });

  describe('AC-2: ingest with no keyword match', () => {
    it('returns matched=false when no keyword matches', async () => {
      const res = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'Hello world, no keywords here',
          smsId: 'sms-002',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.matched).toBe(false);
      expect(res.body.matchedKeyword).toBeNull();
    });
  });

  describe('AC-3: deduplication', () => {
    it('returns existing entry for duplicate smsId', async () => {
      await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'Your OTP is 123',
          smsId: 'sms-dedup',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      const res = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'Your OTP is 123',
          smsId: 'sms-dedup',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.smsId).toBe('sms-dedup');
      expect(res.body.matched).toBe(true);
    });
  });

  describe('AC-4: missing API key', () => {
    it('returns 401 without API key', async () => {
      await http
        .post('/v1/sms')
        .send({
          sender: '+1234567890',
          message: 'Your OTP is 123',
          smsId: 'sms-noauth',
          timestamp: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('AC-5: multiple keyword match (first wins)', () => {
    it('matches first keyword in creation order', async () => {
      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'code', matchMode: 'CONTAINS', workspaceId })
        .expect(201);

      const res = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'Your OTP code is 123',
          smsId: 'sms-multi',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.matched).toBe(true);
      expect(res.body.matchedKeyword).toBe('OTP');
    });
  });

  describe('AC-6: EXACT match mode', () => {
    it('matches exactly', async () => {
      await http
        .post('/v1/keywords')
        .set('Cookie', jar)
        .send({ word: 'ALERT', matchMode: 'EXACT', workspaceId })
        .expect(201);

      const res1 = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'ALERT',
          smsId: 'sms-exact-1',
          timestamp: new Date().toISOString(),
        })
        .expect(201);
      expect(res1.body.matched).toBe(true);
      expect(res1.body.matchedKeyword).toBe('ALERT');

      const res2 = await http
        .post('/v1/sms')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          sender: '+1234567890',
          message: 'ALERT: system down',
          smsId: 'sms-exact-2',
          timestamp: new Date().toISOString(),
        })
        .expect(201);
      expect(res2.body.matched).toBe(false);
    });
  });
});
