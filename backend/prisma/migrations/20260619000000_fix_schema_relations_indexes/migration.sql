-- FixSchemaRelationsIndexes
-- Phase 1: Critical Fixes

-- 1. Add foreign key constraint for ClaimCode.usedByDeviceId -> Device.id
ALTER TABLE "claim_codes" ADD CONSTRAINT "claim_codes_usedByDeviceId_fkey"
  FOREIGN KEY ("usedByDeviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Add unique constraint for Device(workspaceId, publicKey)
ALTER TABLE "devices" ADD CONSTRAINT "devices_workspaceId_publicKey_key"
  UNIQUE ("workspaceId", "publicKey");

-- 3. Add publicApiUrl and forwardUrlEnabled to Workspace
ALTER TABLE "workspaces" ADD COLUMN "publicApiUrl" TEXT;
ALTER TABLE "workspaces" ADD COLUMN "forwardUrlEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Phase 2: Index & Performance

-- 4. Add index on SmsLog.deviceId
CREATE INDEX "sms_logs_deviceId_idx" ON "sms_logs"("deviceId");

-- Phase 3: Cleanup

-- 5. Drop PasswordReset table (unused)
DROP TABLE IF EXISTS "password_resets";

-- 6. Drop User.emailVerifiedAt column (never set)
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerifiedAt";
