import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import type { TenantScopedPrismaService } from '../src/common/prisma/tenant-scoped-prisma.service';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint 2 — Devices & Claim Codes (e2e)', () => {
  let app: INestApplication;
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
    raw = app.get(RawPrismaService);
    http = request(app.getHttpServer());
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    testSlug = `test-s2-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  });

  afterEach(async () => {
    await raw.tenant.deleteMany({ where: { slug: { in: ['test', 'other'] } } });
  });

  describe('AC-1: full claim flow', () => {
    it('completes the full lifecycle', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Device Admin', email: `admin-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);
      expect(codeRes.body.code).toMatch(/^[A-Z0-9]{8}$/);
      expect(new Date(codeRes.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
      const claimCode = codeRes.body.code;

      const claimRes = await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-001' })
        .expect(200);
      expect(claimRes.body.device).toBeDefined();
      expect(claimRes.body.device.id).toBeDefined();
      expect(claimRes.body.device.status).toBe('ACTIVE');
      expect(claimRes.body.apiKey).toBeDefined();
      const deviceId = claimRes.body.device.id;
      const apiKey = claimRes.body.apiKey;

      const hbRes = await http
        .post(`/v1/devices/${deviceId}/heartbeat`)
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
      expect(hbRes.body.lastSeenAt).toBeDefined();

      const listRes = await http
        .get('/v1/devices')
        .set('Cookie', jar)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      const device = listRes.body.find((d: { id: string }) => d.id === deviceId);
      expect(device).toBeDefined();
      expect(device.status).toBe('ACTIVE');

      await http
        .delete(`/v1/devices/${deviceId}`)
        .set('Cookie', jar)
        .expect(200);

      const listAfterRevoke = await http
        .get('/v1/devices')
        .set('Cookie', jar)
        .expect(200);
      const revokedDevice = listAfterRevoke.body.find((d: { id: string }) => d.id === deviceId);
      expect(revokedDevice.status).toBe('REVOKED');
    });
  });

  describe('AC-2: double-use prevention', () => {
    it('claiming a code twice returns 409 Conflict', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Admin Two', email: `admin2-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);
      const claimCode = codeRes.body.code;

      await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-002' })
        .expect(200);

      await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-003' })
        .expect(409);
    });
  });

  describe('AC-3: cross-tenant claim', () => {
    it('claiming with a valid code works regardless of caller', async () => {
      const signupA = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant A', email: `tenanta-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarA = cookies(signupA.headers);
      const workspaceIdA = await createWorkspace(jarA);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jarA)
        .send({ ttlMinutes: 15, workspaceId: workspaceIdA })
        .expect(201);
      const claimCode = codeRes.body.code;

      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `tenantb-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);

      await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-cross' })
        .expect(200);
    });
  });

  describe('AC-4: revoked-device heartbeat rejection', () => {
    it('revoking a device makes its heartbeat return 401', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Heartbeat Admin', email: `hbadmin-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);
      const claimCode = codeRes.body.code;

      const claimRes = await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-hb' })
        .expect(200);
      const deviceId = claimRes.body.device.id;
      const apiKey = claimRes.body.apiKey;

      await http
        .delete(`/v1/devices/${deviceId}`)
        .set('Cookie', jar)
        .expect(200);

      await http
        .post(`/v1/devices/${deviceId}/heartbeat`)
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(401);
    });
  });

  describe('AC-10: cancel unused claim code', () => {
    it('cancels an unused claim code and returns 204', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Cancel Admin', email: `cancel-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);

      const listRes = await http
        .get('/v1/claim-codes')
        .set('Cookie', jar)
        .expect(200);
      const codeId = listRes.body[0].id;
      expect(codeId).toBeDefined();

      await http
        .delete(`/v1/claim-codes/${codeId}`)
        .set('Cookie', jar)
        .expect(204);

      const listAfter = await http
        .get('/v1/claim-codes')
        .set('Cookie', jar)
        .expect(200);
      const cancelled = listAfter.body.find((c: { id: string }) => c.id === codeId);
      expect(new Date(cancelled.expiresAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('returns 409 when trying to cancel a used claim code', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'Used Admin', email: `used-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      const codeRes = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);
      const claimCode = codeRes.body.code;

      await http
        .post('/v1/claim-codes/claim')
        .send({ code: claimCode, publicKey: 'test-public-key-cancel' })
        .expect(200);

      const listRes = await http
        .get('/v1/claim-codes')
        .set('Cookie', jar)
        .expect(200);
      const usedCode = listRes.body.find((c: { code: string }) => c.code === claimCode);
      expect(usedCode).toBeDefined();
      expect(usedCode.usedAt).toBeDefined();

      await http
        .delete(`/v1/claim-codes/${usedCode.id}`)
        .set('Cookie', jar)
        .expect(409);
    });

    it('returns 404 for claim code from different tenant', async () => {
      const signupA = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant A', email: `crossa-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarA = cookies(signupA.headers);
      const workspaceIdA = await createWorkspace(jarA);

      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `crossb-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);

      await http
        .post('/v1/claim-codes')
        .set('Cookie', jarA)
        .send({ ttlMinutes: 15, workspaceId: workspaceIdA })
        .expect(201);

      const listA = await http
        .get('/v1/claim-codes')
        .set('Cookie', jarA)
        .expect(200);
      const codeId = listA.body[0].id;

      await http
        .delete(`/v1/claim-codes/${codeId}`)
        .set('Cookie', jarB)
        .expect(404);
    });
  });

  describe('AC-7a: revoked-device reactivation', () => {
    it('revokes device, then reclaims with same public key → device reactivated', async () => {
      const signup = await http
        .post('/v1/auth/signup')
        .send({ name: 'React Admin', email: `react-${testSlug}@test.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jar = cookies(signup.headers);
      const workspaceId = await createWorkspace(jar);

      const code1 = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);

      const claim1 = await http
        .post('/v1/claim-codes/claim')
        .send({ code: code1.body.code, publicKey: 'react-key-001' })
        .expect(200);
      const deviceId = claim1.body.device.id;

      await http
        .delete(`/v1/devices/${deviceId}`)
        .set('Cookie', jar)
        .expect(200);

      const code2 = await http
        .post('/v1/claim-codes')
        .set('Cookie', jar)
        .send({ ttlMinutes: 15, workspaceId })
        .expect(201);

      const claim2 = await http
        .post('/v1/claim-codes/claim')
        .send({ code: code2.body.code, publicKey: 'react-key-001' })
        .expect(200);

      expect(claim2.body.device.id).toBe(deviceId);
      expect(claim2.body.device.status).toBe('ACTIVE');
      expect(claim2.body.apiKey).toBeDefined();
    });
  });
});
