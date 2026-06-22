import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint — Users (e2e)', () => {
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
    testSlug = `test-users-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const signup = await http
      .post('/v1/auth/signup')
      .send({ name: 'User Admin', email: `user-${testSlug}@test.com`, password: 'Strong1Pass!' })
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
    await raw.keyword.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.smsLog.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.claimCode.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.userWorkspace.deleteMany({ where: { user: { tenant: { slug: { in: ['test', 'other'] } } } } });
    await raw.workspace.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.user.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.tenant.deleteMany({ where: { slug: { in: ['test', 'other'] } } });
  });

  describe('AC-1: invite user happy path', () => {
    it('creates a user with 201 and returns id, email, name, role', async () => {
      const invitedEmail = `invited-${testSlug}@test.com`;
      const res = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Invited User', role: 'ADMIN', tempPassword: 'TempPass1!' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(invitedEmail);
      expect(res.body.name).toBe('Invited User');
      expect(res.body.role).toBe('ADMIN');
    });
  });

  describe('AC-2: list users', () => {
    it('returns array containing the invited user', async () => {
      const invitedEmail = `invited-${testSlug}@test.com`;
      await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Invited User', tempPassword: 'TempPass1!' })
        .expect(201);

      const res = await http
        .get('/v1/users')
        .set('Cookie', jar)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((u: { email: string }) => u.email === invitedEmail);
      expect(found).toBeDefined();
    });
  });

  describe('AC-3: get user by id', () => {
    it('returns the correct user with matching email', async () => {
      const invitedEmail = `invited-${testSlug}@test.com`;
      const createRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Invited User', tempPassword: 'TempPass1!' })
        .expect(201);

      const userId = createRes.body.id;

      const res = await http
        .get(`/v1/users/${userId}`)
        .set('Cookie', jar)
        .expect(200);

      expect(res.body.email).toBe(invitedEmail);
    });
  });

  describe('AC-4: change user role', () => {
    it('updates the role to ADMIN', async () => {
      const invitedEmail = `invited-${testSlug}@test.com`;
      const createRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Invited User', tempPassword: 'TempPass1!' })
        .expect(201);

      const userId = createRes.body.id;

      const res = await http
        .patch(`/v1/users/${userId}/role`)
        .set('Cookie', jar)
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(res.body.role).toBe('ADMIN');
    });
  });

  describe('AC-5: deactivate user', () => {
    it('deactivates user then login attempt returns 401', async () => {
      const invitedEmail = `invited-${testSlug}@test.com`;
      const tempPassword = 'TempPass1!';
      const createRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Invited User', tempPassword })
        .expect(201);

      const userId = createRes.body.id;

      await http
        .delete(`/v1/users/${userId}`)
        .set('Cookie', jar)
        .expect(200);

      await http
        .post('/v1/auth/login')
        .send({ email: invitedEmail, password: tempPassword })
        .expect(401);
    });
  });

  describe('AC-6: deactivated user cannot login', () => {
    it('invited VIEWER can login before deactivation, then login fails after', async () => {
      const invitedEmail = `viewer-${testSlug}@test.com`;
      const tempPassword = 'TempPass1!';
      const createRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Viewer User', role: 'VIEWER', tempPassword })
        .expect(201);

      const userId = createRes.body.id;

      // Verify VIEWER can login before deactivation
      const loginRes = await http
        .post('/v1/auth/login')
        .send({ email: invitedEmail, password: tempPassword })
        .expect(200);
      expect(loginRes.body.accessToken).toBeDefined();

      // Deactivate the VIEWER
      await http
        .delete(`/v1/users/${userId}`)
        .set('Cookie', jar)
        .expect(200);

      // Attempt login after deactivation
      await http
        .post('/v1/auth/login')
        .send({ email: invitedEmail, password: tempPassword })
        .expect(401);
    });
  });

  describe('AC-7: cross-tenant access denied', () => {
    it('returns 404 when accessing user from different tenant', async () => {
      // Invite user in tenant A ('test')
      const invitedEmail = `invited-${testSlug}@test.com`;
      const createRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: invitedEmail, name: 'Tenant A User', tempPassword: 'TempPass1!' })
        .expect(201);

      const userAId = createRes.body.id;

      // Signup as tenant B ('other')
      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B Owner', email: `owner-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);

      // Try to access tenant A's user with tenant B's jar
      await http
        .get(`/v1/users/${userAId}`)
        .set('Cookie', jarB)
        .expect(404);
    });
  });

  describe('AC-8: non-admin cannot invite', () => {
    it('returns 403 when VIEWER tries to invite', async () => {
      // Invite a VIEWER user
      const viewerEmail = `viewer-${testSlug}@test.com`;
      const tempPassword = 'TempPass1!';
      await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: viewerEmail, name: 'Viewer User', role: 'VIEWER', tempPassword })
        .expect(201);

      // Login as VIEWER
      const loginRes = await http
        .post('/v1/auth/login')
        .send({ email: viewerEmail, password: tempPassword })
        .expect(200);
      const viewerJar = cookies(loginRes.headers);

      // Try to invite as VIEWER
      await http
        .post('/v1/users')
        .set('Cookie', viewerJar)
        .send({ email: `newuser-${testSlug}@test.com`, name: 'New User', tempPassword: 'TempPass1!' })
        .expect(403);
    });
  });
});
