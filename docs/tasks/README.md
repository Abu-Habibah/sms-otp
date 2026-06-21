# Task: SMS Monitor v2.0 — Audit Remediation

**Created:** 2026-06-21
**Source:** Comprehensive 5-agent audit
**Total Estimated:** ~11 hours

---

## Task Documents

| Phase | Task | System | Priority | Est. | Parallel? |
|-------|------|--------|----------|------|-----------|
| 1 | [Security Hardening](be-task-phase1-security-hardening.md) | be | Critical | 4h | ✅ Yes |
| 2 | [Missing Core Features](be-task-phase2-missing-features.md) | be | High | 3h | ✅ Yes |
| 3 | [Infrastructure & Testing](be-task-phase3-infra-testing.md) | be, web, test | High | 3h | ✅ Yes |
| 4 | [Documentation Cleanup](be-task-phase4-docs-cleanup.md) | shared, web, android | Medium | 1h | ✅ Yes |

---

## Dependencies & Execution

All 4 phases can be executed **in parallel** — they touch different files or different parts of shared files without conflicts:

| File | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Conflict? |
|------|---------|---------|---------|---------|-----------|
| `auth.service.ts` | hashRefreshToken fix (line 130) | ADD new methods (no line conflict) | — | — | No |
| `auth.controller.ts` | Add validation pipe | ADD new endpoints | — | — | No |
| `devices.service.ts` | — | — | Fix sort order (line 139) | — | No |
| `sms-logs.controller.ts` | — | — | Add pagination | — | No |
| `sms-ingest.service.ts` | — | — | Add pagination | — | No |
| `SmsLogsClient.tsx` | — | — | Add pagination UI | — | No |
| `health.controller.ts` | Sanitize URL | — | — | — | No |
| `main.ts` | Fix CORS | — | — | — | No |
| `schema.prisma` | — | Add PasswordResetToken | — | — | No |
| `docker-compose.yml` | Remove secret, add env | Add MAIL_HOST env | — | — | Minor (can merge) |
| Sprint/feature docs | — | — | — | All doc fixes | No |
| E2e test files | — | NEW test file | 4 NEW test files | — | No |
| `claim-codes.controller.ts` | Add validation | — | — | — | No |

**Only minor merge risk:** `docker-compose.yml` (Phase 1 adds env vars, Phase 2 adds MAIL_HOST) — easily mergeable.

---

## Execution Order

For maximum throughput, run Phases 1-4 in parallel:

```bash
# Terminal 1: Phase 1
task(load_skills=["project-rules"], prompt="docs/tasks/be-task-phase1-security-hardening.md")

# Terminal 2: Phase 2
task(load_skills=["project-rules"], prompt="docs/tasks/be-task-phase2-missing-features.md")

# Terminal 3: Phase 3
task(load_skills=["project-rules"], prompt="docs/tasks/be-task-phase3-infra-testing.md")

# Terminal 4: Phase 4
task(load_skills=["project-rules"], prompt="docs/tasks/be-task-phase4-docs-cleanup.md")
```

Or execute sequentially if you prefer to review each phase before starting the next.

---

## Verification After All Phases

- [ ] Backend compiles: `pnpm --filter @sms-monitor/backend build`
- [ ] E2e tests: 62+ tests passing (35 existing + 27 new)
- [ ] Docker containers healthy: `docker compose ps`
- [ ] Manual smoke: forgot-password → reset-password → login
- [ ] Sprint docs statuses match README
- [ ] No "coming soon" stubs in code
- [ ] No hardcoded secrets in committed files

---

## Audit Summary

| Category | Items Found | In These Phases |
|----------|-------------|-----------------|
| Critical Security | 6 | Phase 1 (5 of 6), Phase 2 (password reset) |
| High Missing Features | 10 | Phase 1 (CORS), Phase 2 (password complexity), Phase 3 (sort, tests, pagination) |
| Medium Infrastructure | 8 | Phase 3 (some), Deferred (Docker resources, CI/CD, logging, backup) |
| Documentation Staleness | 9 | Phase 4 (all 9) |

**Deferred to v3+:**
- Email verification flow
- Account lockout after failed attempts  
- CI/CD pipeline (GitHub Actions)
- Docker resource limits
- Structured logging
- Postgres backup strategy
