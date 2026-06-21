# Task: Phase 2 — Missing Core Features

**System:** be
**Priority:** High
**Estimated:** ~3 hours
**Can Run In Parallel With:** Phase 1, Phase 3, Phase 4
**Depends On:** Nothing (additive — creates new endpoints, doesn't modify existing)

---

## Goal

Implement password reset flow and password complexity validation — features documented since Sprint 2 but never implemented.

---

## Task 2.1 — Password Reset Flow

**New endpoints needed:**
- `POST /v1/auth/forgot-password` — Accepts email, sends reset link via MailHog (dev) or SMTP (prod)
- `POST /v1/auth/reset-password` — Accepts token + new password, resets credentials

**Steps:**

### 1. Create PasswordReset model in Prisma schema

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_tokens")
}
```

### 2. Add to User and Tenant relations

- `User` model: add `passwordResetTokens PasswordResetToken[]`
- `Tenant` model: add `passwordResetTokens PasswordResetToken[]`

### 3. Create migration and apply

```bash
npx prisma migrate dev --name add_password_reset_tokens
```

### 4. Add methods to AuthService

**File:** `backend/src/auth/auth.service.ts`

```typescript
async forgotPassword(email: string): Promise<void> {
  // Find user, generate token, store hash, send email (MailHog in dev)
  // Never reveal whether email exists (constant-time response)
}

async resetPassword(token: string, newPassword: string): Promise<void> {
  // Validate token hash, check expiry, update password hash, mark token used
  // Invalidate all refresh tokens for security
}
```

### 5. Add MailHog email sending

**File:** `backend/src/auth/auth.service.ts` (or new `backend/src/mail/mail.service.ts`)

Use `nodemailer` to send via MailHog in development:
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST ?? 'mh',
  port: 1025,
});
```

### 6. Add endpoints to AuthController

**File:** `backend/src/auth/auth.controller.ts`

- `@Post('/forgot-password')` — `@Public()`, throttled to 3 req/min/IP (prevent abuse)
- `@Post('/reset-password')` — `@Public()`, validates token and new password

---

## Task 2.2 — Password Complexity Validation

**File:** `backend/src/auth/auth.service.ts` (signup and reset-password methods)

**Steps:**
1. Create a `validatePassword()` function:
   ```typescript
   function validatePassword(password: string): void {
     if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
     if (!/[A-Z]/.test(password)) throw new BadRequestException('Password must contain at least one uppercase letter');
     if (!/[a-z]/.test(password)) throw new BadRequestException('Password must contain at least one lowercase letter');
     if (!/[0-9]/.test(password)) throw new BadRequestException('Password must contain at least one number');
   }
   ```
2. Call in `signup()` before hashing
3. Call in `resetPassword()` before hashing
4. Add password requirements hint to signup form (`SignupForm.tsx`)

---

## Task 2.3 — Update Dependencies

Add to `backend/package.json`:
```json
"dependencies": {
  "nodemailer": "^6.9.0",
  "@types/nodemailer": "^6.4.0"
}
```

Add to `docker-compose.yml` be service:
```yaml
environment:
  MAIL_HOST: mh  # MailHog in dev
```

---

## Deliverables

- [ ] Prisma schema updated with `PasswordResetToken` model
- [ ] Migration applied: `add_password_reset_tokens`
- [ ] `POST /v1/auth/forgot-password` — accepts email, sends reset link
- [ ] `POST /v1/auth/reset-password` — accepts token + password, resets
- [ ] `validatePassword()` enforces complexity rules
- [ ] All existing passwords continue to work (grandfathered)
- [ ] Backend compiles clean
- [ ] Manual smoke test: forgot-password → check MailHog → reset-password → login with new password
- [ ] All 35 existing e2e tests still pass
- [ ] New e2e test: `auth-password-reset.e2e-spec.ts` covering happy path + expired token + invalid token

---

## Files Changed

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add PasswordResetToken model + relations |
| `backend/prisma/migrations/*` | NEW migration |
| `backend/src/auth/auth.service.ts` | Add forgotPassword, resetPassword, validatePassword |
| `backend/src/auth/auth.controller.ts` | Add 2 new endpoints |
| `backend/src/mail/mail.service.ts` | NEW — MailHog email sender |
| `backend/package.json` | Add nodemailer |
| `docker-compose.yml` | Add MAIL_HOST env |
| `backend/test/auth-password-reset.e2e-spec.ts` | NEW — e2e test |
