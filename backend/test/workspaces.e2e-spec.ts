import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { RawPrismaService } from '../src/common/prisma/raw-prisma.service';

describe('Sprint 9 — Workspaces (e2e)', () => {
  let app: INestApplication;
  let raw: RawPrismaService;
  let testSlug: string;
  let http: ReturnType<typeof request>;
  let jar: string;

  function cookies(headers: Record<string, unknown>): string {
    const setCookie = (headers['set-cookie'] ?? []) as string[];
    return setCookie.map((c: string) => c.split(';')[0]).join('; ');
  }

  async function createWorkspace(name?: string): Promise<string> {
    const res = await http
      .post('/v1/workspaces')
      .set('Cookie', jar)
      .send({ name: name ?? 'Test Workspace' })
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

  beforeEach(async () => {
    testSlug = `test-ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const signup = await http
      .post('/v1/auth/signup')
      .send({ name: 'Workspace Admin', email: `ws-${testSlug}@test.com`, password: 'Strong1Pass!' })
      .expect(201);
    jar = cookies(signup.headers);
  });

  afterEach(async () => {
    await raw.claimCode.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.smsLog.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.keyword.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.userWorkspace.deleteMany({
      where: { workspace: { tenant: { slug: { in: ['test', 'other'] } } } },
    });
    await raw.workspace.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.user.deleteMany({ where: { tenant: { slug: { in: ['test', 'other'] } } } });
    await raw.tenant.deleteMany({ where: { slug: { in: ['test', 'other'] } } });
  });

  describe('AC-1: create workspace happy path', () => {
    it('creates a workspace and returns 201 with id, name, and slug', async () => {
      const res = await http
        .post('/v1/workspaces')
        .set('Cookie', jar)
        .send({ name: 'My Workspace' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('My Workspace');
      expect(res.body.slug).toBe('my-workspace');
    });
  });

  describe('AC-2: list workspaces', () => {
    it('returns array containing created workspace', async () => {
      const workspaceId = await createWorkspace('List Test Workspace');

      const res = await http
        .get('/v1/workspaces')
        .set('Cookie', jar)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((w: { id: string }) => w.id === workspaceId);
      expect(found).toBeDefined();
      expect(found.name).toBe('List Test Workspace');
    });
  });

  describe('AC-3: get workspace by id', () => {
    it('returns workspace with matching name', async () => {
      const workspaceId = await createWorkspace('Detail Workspace');

      const res = await http
        .get(`/v1/workspaces/${workspaceId}`)
        .set('Cookie', jar)
        .expect(200);

      expect(res.body.id).toBe(workspaceId);
      expect(res.body.name).toBe('Detail Workspace');
    });
  });

  describe('AC-4: update workspace', () => {
    it('updates the workspace name', async () => {
      const workspaceId = await createWorkspace('Old Name');

      const res = await http
        .patch(`/v1/workspaces/${workspaceId}`)
        .set('Cookie', jar)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.name).toBe('New Name');
    });
  });

  describe('AC-5: delete workspace', () => {
    it('deletes workspace then returns 404 on GET', async () => {
      const workspaceId = await createWorkspace('Delete Me');

      await http
        .delete(`/v1/workspaces/${workspaceId}`)
        .set('Cookie', jar)
        .expect(200);

      await http
        .get(`/v1/workspaces/${workspaceId}`)
        .set('Cookie', jar)
        .expect(404);
    });
  });

  describe('AC-6: add member', () => {
    it('invites a user and adds them to workspace', async () => {
      const workspaceId = await createWorkspace('Member Workspace');

      // Invite a user first
      const inviteRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: `member-${testSlug}@test.com`, name: 'Member User', tempPassword: 'Temp1Pass!' })
        .expect(201);
      const userId = inviteRes.body.id;

      // Add them to workspace
      const addRes = await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(201);

      expect(addRes.body.userId).toBe(userId);
      expect(addRes.body.workspaceId).toBe(workspaceId);
      expect(addRes.body.role).toBe('MEMBER');
    });
  });

  describe('AC-7: list members', () => {
    it('returns members with user details', async () => {
      const workspaceId = await createWorkspace('Members List Workspace');

      // Invite and add a user
      const inviteRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: `listmember-${testSlug}@test.com`, name: 'List Member', tempPassword: 'Temp1Pass!' })
        .expect(201);
      const userId = inviteRes.body.id;

      await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(201);

      // List members — should have 2 (creator as OWNER + added member)
      const res = await http
        .get(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const member = res.body.find((m: { userId: string }) => m.userId === userId);
      expect(member).toBeDefined();
      expect(member.user.id).toBe(userId);
      expect(member.user.email).toBe(`listmember-${testSlug}@test.com`);
      expect(member.user.name).toBe('List Member');
      expect(member.role).toBe('MEMBER');
    });
  });

  describe('AC-8: update member role', () => {
    it('changes a member role', async () => {
      const workspaceId = await createWorkspace('Role Update Workspace');

      const inviteRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: `roleuser-${testSlug}@test.com`, name: 'Role User', tempPassword: 'Temp1Pass!' })
        .expect(201);
      const userId = inviteRes.body.id;

      await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(201);

      const res = await http
        .patch(`/v1/workspaces/${workspaceId}/members/${userId}`)
        .set('Cookie', jar)
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(res.body.role).toBe('ADMIN');
    });
  });

  describe('AC-9: remove member', () => {
    it('removes member then verifies they are gone', async () => {
      const workspaceId = await createWorkspace('Remove Member Workspace');

      const inviteRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: `rmuser-${testSlug}@test.com`, name: 'Remove User', tempPassword: 'Temp1Pass!' })
        .expect(201);
      const userId = inviteRes.body.id;

      await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(201);

      await http
        .delete(`/v1/workspaces/${workspaceId}/members/${userId}`)
        .set('Cookie', jar)
        .expect(200);

      const listRes = await http
        .get(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .expect(200);

      const removed = listRes.body.find((m: { userId: string }) => m.userId === userId);
      expect(removed).toBeUndefined();
    });
  });

  describe('AC-10: cannot remove last owner', () => {
    it('returns 409 when trying to remove the last workspace owner', async () => {
      const workspaceId = await createWorkspace('Last Owner Workspace');

      // Creator is auto-added as OWNER — get their userId from members list
      const membersRes = await http
        .get(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .expect(200);

      const owner = membersRes.body.find((m: { role: string }) => m.role === 'OWNER');
      expect(owner).toBeDefined();

      // Try to remove the last owner
      await http
        .delete(`/v1/workspaces/${workspaceId}/members/${owner.userId}`)
        .set('Cookie', jar)
        .expect(409);
    });
  });

  describe('AC-11: non-member cannot access workspace', () => {
    it('returns 404 when accessing workspace from different tenant', async () => {
      // Create workspace in tenant 'test'
      const workspaceId = await createWorkspace('Tenant A Workspace');

      // Signup as a different tenant (different email domain → different slug)
      const signupB = await http
        .post('/v1/auth/signup')
        .send({ name: 'Tenant B', email: `ws-b-${testSlug}@other.com`, password: 'Strong1Pass!' })
        .expect(201);
      const jarB = cookies(signupB.headers);

      // Try to access tenant A's workspace with tenant B's jar
      await http
        .get(`/v1/workspaces/${workspaceId}`)
        .set('Cookie', jarB)
        .expect(404);
    });
  });

  describe('AC-12: duplicate member', () => {
    it('returns 409 when adding same user twice', async () => {
      const workspaceId = await createWorkspace('Duplicate Member Workspace');

      const inviteRes = await http
        .post('/v1/users')
        .set('Cookie', jar)
        .send({ email: `dupe-${testSlug}@test.com`, name: 'Dupe User', tempPassword: 'Temp1Pass!' })
        .expect(201);
      const userId = inviteRes.body.id;

      await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(201);

      // Try to add same user again
      await http
        .post(`/v1/workspaces/${workspaceId}/members`)
        .set('Cookie', jar)
        .send({ userId, role: 'MEMBER' })
        .expect(409);
    });
  });
});
