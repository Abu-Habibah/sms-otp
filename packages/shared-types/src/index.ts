/**
 * Shared Zod schemas and TypeScript types for SMS Monitor v2.0.
 *
 * Imported by both the backend (NestJS) for request validation and by the
 * web admin (Next.js) for form validation. Adding a field here propagates
 * to both sides at compile time.
 */
import { z } from "zod";

/* ──────────────────────────────────────────────────────────────────────────
 * Enums
 * ────────────────────────────────────────────────────────────────────────── */

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  VIEWER: "VIEWER",
} as const;
export const userRoleSchema = z.enum(["OWNER", "ADMIN", "VIEWER"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const DeviceStatus = {
  PENDING_CLAIM: "PENDING_CLAIM",
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  SUSPENDED: "SUSPENDED",
} as const;
export const deviceStatusSchema = z.enum([
  "PENDING_CLAIM",
  "ACTIVE",
  "REVOKED",
  "SUSPENDED",
]);
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

export const SmsStatus = {
  PENDING: "PENDING",
  FORWARDED: "FORWARDED",
  FAILED: "FAILED",
} as const;
export const smsStatusSchema = z.enum(["PENDING", "FORWARDED", "FAILED"]);
export type SmsStatus = z.infer<typeof smsStatusSchema>;

export const MatchMode = {
  EXACT: "EXACT",
  CONTAINS: "CONTAINS",
  REGEX: "REGEX",
  AT_START: "AT_START",
  AT_END: "AT_END",
} as const;
export const matchModeSchema = z.enum([
  "EXACT",
  "CONTAINS",
  "REGEX",
  "AT_START",
  "AT_END",
]);
export type MatchMode = z.infer<typeof matchModeSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Workspaces
 * ────────────────────────────────────────────────────────────────────────── */

export const WorkspaceRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;
export const workspaceRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(100),
  forwardUrl: z.string().url().nullish(),
  forwardUrlEnabled: z.boolean().default(true),
  retentionDays: z.number().int().min(1).max(365).default(90),
  publicApiUrl: z.string().url().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceSchema = workspaceSchema
  .pick({ name: true })
  .extend({
    forwardUrl: z.string().url().optional().or(z.literal('')),
    forwardUrlEnabled: z.boolean().optional(),
    retentionDays: z.number().int().min(1).max(365).optional(),
    publicApiUrl: z.string().url().optional().or(z.literal('')),
  });
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = createWorkspaceSchema.partial();
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const userWorkspaceSchema = z.object({
  userId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  role: workspaceRoleSchema,
  createdAt: z.string().datetime(),
});
export type UserWorkspace = z.infer<typeof userWorkspaceSchema>;

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: workspaceRoleSchema.default("MEMBER"),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Tenants
 * ────────────────────────────────────────────────────────────────────────── */

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, digits, and hyphens"),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).default("FREE"),
  forwardUrl: z.string().url().nullish(),
  forwardUrlEnabled: z.boolean().default(true),
  retentionDays: z.number().int().min(1).max(365).default(90),
  publicApiUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Tenant = z.infer<typeof tenantSchema>;

export const createTenantSchema = tenantSchema
  .pick({ name: true, slug: true })
  .extend({ plan: tenantSchema.shape.plan.optional() });
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Users
 * ────────────────────────────────────────────────────────────────────────── */

export const userSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: userRoleSchema,
  emailVerified: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
  role: userRoleSchema.default("VIEWER"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Devices
 * ────────────────────────────────────────────────────────────────────────── */

export const deviceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  manufacturer: z.string().max(50).nullish(),
  model: z.string().max(50).nullish(),
  osVersion: z.string().max(50).nullish(),
  appVersion: z.string().max(50).nullish(),
  simSlot1Number: z.string().max(20).nullish(),
  simSlot2Number: z.string().max(20).nullish(),
  deviceModel: z.string().max(50).nullish(),
  androidVersion: z.string().max(50).nullish(),
  lastHeartbeat: z.string().datetime().nullish(),
  status: deviceStatusSchema,
  lastSeenAt: z.string().datetime().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identifyRequestedAt: z.string().datetime().nullish(),
  identifyAckedAt: z.string().datetime().nullish(),
});
export type Device = z.infer<typeof deviceSchema>;

export const registerDeviceSchema = z.object({
  tenantId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  manufacturer: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  osVersion: z.string().max(50).optional(),
  appVersion: z.string().max(50).optional(),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Keywords
 * ────────────────────────────────────────────────────────────────────────── */

export const keywordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  word: z.string().min(2).max(50),
  matchMode: matchModeSchema,
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Keyword = z.infer<typeof keywordSchema>;

export const createKeywordSchema = z.object({
  word: z.string().min(2).max(50),
  matchMode: matchModeSchema.default("CONTAINS"),
  enabled: z.boolean().default(true),
});
export type CreateKeywordInput = z.infer<typeof createKeywordSchema>;

export const updateKeywordSchema = createKeywordSchema.partial();
export type UpdateKeywordInput = z.infer<typeof updateKeywordSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * SMS Logs
 * ────────────────────────────────────────────────────────────────────────── */

export const smsLogSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  smsId: z.string(),
  sender: z.string(),
  message: z.string(),
  matchedKeyword: z.string().optional(),
  status: smsStatusSchema,
  retryCount: z.number().int().min(0).default(0),
  errorMessage: z.string().optional(),
  receivedAt: z.string().datetime(),
  forwardedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});
export type SmsLog = z.infer<typeof smsLogSchema>;

export const deviceApiKeySchema = z.object({
  deviceId: z.string().uuid(),
  apiKey: z.string(),
  name: z.string(),
});
export type DeviceApiKey = z.infer<typeof deviceApiKeySchema>;

export const listDevicesResponseSchema = z.object({
  devices: z.array(deviceSchema),
  total: z.number().int().nonnegative(),
});
export type ListDevicesResponse = z.infer<typeof listDevicesResponseSchema>;

export const claimDeviceResponseSchema = z.object({
  device: deviceSchema,
  apiKey: z.string(),
});
export type ClaimDeviceResponse = z.infer<typeof claimDeviceResponseSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Claim Codes (device onboarding)
 * ────────────────────────────────────────────────────────────────────────── */

export const claimCodeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string().regex(/^[A-Z0-9]{6,12}$/, "claim code must be 6-12 uppercase alphanumeric chars"),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  usedByDeviceId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type ClaimCode = z.infer<typeof claimCodeSchema>;

export const createClaimCodeSchema = z.object({
  tenantId: z.string().uuid(),
  ttlMinutes: z.number().int().min(5).max(60).default(15),
});
export type CreateClaimCodeInput = z.infer<typeof createClaimCodeSchema>;

export const claimDeviceSchema = z.object({
  claimCode: z.string().regex(/^[A-Z0-9]{6,12}$/),
  publicKey: z.string().min(1),
  deviceInfo: z.object({
    manufacturer: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    osVersion: z.string().max(50).optional(),
    appVersion: z.string().max(50).optional(),
  }).optional(),
});
export type ClaimDeviceInput = z.infer<typeof claimDeviceSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * Authentication
 * ────────────────────────────────────────────────────────────────────────── */

export const loginSchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().min(1),
  user: userSchema,
  tenant: tenantSchema,
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

/* ──────────────────────────────────────────────────────────────────────────
 * API Error envelope
 * ────────────────────────────────────────────────────────────────────────── */

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const LoginInputSchema = loginSchema;
export const UserSchema = userSchema;
export const TenantSchema = tenantSchema;
export const AuthTokensSchema = authTokensSchema;
export const ApiErrorSchema = apiErrorSchema;
export const CreateUserSchema = createUserSchema;
export const CreateTenantSchema = createTenantSchema;
export const CreateWorkspaceSchema = createWorkspaceSchema;
export const UpdateWorkspaceSchema = updateWorkspaceSchema;
export const CreateKeywordSchema = createKeywordSchema;
export const UpdateKeywordSchema = updateKeywordSchema;
export const RegisterDeviceSchema = registerDeviceSchema;
export const CreateClaimCodeSchema = createClaimCodeSchema;
export const ClaimDeviceSchema = claimDeviceSchema;
export const DeviceApiKeySchema = deviceApiKeySchema;
export const ListDevicesResponseSchema = listDevicesResponseSchema;
export const ClaimDeviceResponseSchema = claimDeviceResponseSchema;
