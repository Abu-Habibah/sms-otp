-- RemoveClaimCodeUsedByDeviceUnique
-- The @unique constraint on usedByDeviceId prevents device reactivation
-- (a second claim code referencing the same device violates the constraint)

DROP INDEX IF EXISTS "claim_codes_usedByDeviceId_key";
