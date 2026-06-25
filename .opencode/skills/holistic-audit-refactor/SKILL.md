---
name: holistic-audit-refactor
version: v1.0 (Build: 001)
description: Full-stack code audit, bug detection, security hardening, performance optimization, and safe refactoring. Use when auditing codebase, fixing bugs, reviewing security, optimizing performance, or refactoring architecture. Triggers: 'audit project', 'refactor code', 'fix bugs', 'security review', 'code cleanup', 'improve performance'.
related_skills:
  - project-rules
  - prompt-rules
---

# Holistic Code Audit & Refactor - Comprehensive Methodology

## Integration with project-rules

This skill REFERENCES `project-rules` for:
- **System Prefix Table (Rule 9)** — consistent naming conventions
- **Auto Documentation (Rule 1)** — audit findings logged per project-rules doc format
- **Version Bump (Rule 8)** — version bumped after audit/refactor completion
- **Doc Index (Rule 5)** — audit reports added to README.md documentation index

This skill REFERENCES `prompt-rules` for:
- **Prompt Generator** — generate structured audit prompts for specific modules
- **Prompt Executor** — execute audit prompts in correct dependency order

---

## Phase 0: Pre-Flight Assessment (MANDATORY — do this first)

Before any analysis, code change, or audit — establish baseline and scope.

### 0.1 Project Size Classification
| Size | File Count | Strategy |
|------|-----------|----------|
| **Small** | < 50 files | Process all phases sequentially in one pass |
| **Medium** | 50–200 files | Process by module, highest-risk module first. User confirms each module before next. |
| **Large** | > 200 files | Process by module. User confirms phases per module. Generate prompt per module via prompt-rules. |

### 0.2 Discovery
1. **Identify full tech stack** — languages, frameworks, runtime versions, build tools, test runners, linters, formatters, package managers
2. **Identify test coverage** — does the project have tests? What framework? Can they be run? What's the current pass rate?
3. **Identify config files** — read ALL of: `.eslintrc.*`, `.prettierrc*`, `tsconfig.json`, `jsconfig.json`, `.editorconfig`, `.env.example`
4. **Identify excluded paths** — explicitly list what to skip: `node_modules/`, `vendor/`, `dist/`, `build/`, `out/`, `coverage/`, `generated/`, `.git/`, `*.min.js`, `*.bundle.js`
5. **Identify existing documentation** — README.md, docs/, CHANGELOG.md, API docs, architecture docs

### 0.3 Build Baseline (CRITICAL — must capture before making changes)
1. **Run build** — `npm run build` / `go build` / `dotnet build` / `cargo build` / `mix compile` — capture exit code and errors
2. **Run tests** — `npm test` / `go test ./...` / `dotnet test` / `cargo test` — capture pass/fail count
3. **Run linter** — `npm run lint` / `golangci-lint run` / `dotnet format --verify-no-changes` — capture error count
4. **Run type checker** — `npx tsc --noEmit` / `mypy .` — capture error count
5. **LSP diagnostics** — check all files for pre-existing diagnostics
6. **Save baseline** — record baseline numbers for comparison after changes

### 0.4 Set Exclusion Zones

```
❌ DO NOT modify:
- node_modules/, vendor/, .git/
- dist/, build/, out/, coverage/, .next/
- Generated code files (check for header comments like "DO NOT EDIT")
- package-lock.json, yarn.lock, pnpm-lock.yaml (unless intentionally changing deps)
- Third-party library source files
- Minified/bundled assets
- Database migration files already applied
- Any file outside the project's source boundaries

⚠️ CAUTION when modifying:
- .env files (never commit secrets)
- CI/CD config files (.github/, .gitlab-ci.yml)
- Dockerfiles (coordinate with Docker setup if used)
- API contracts that external consumers depend on
```

---

## Phase 1: System Architecture Analysis

### 1.1 Structural Assessment
Produce a structured document of:

1. **Architecture pattern** — MVC, MVVM, layered, microservices, monolith, event-driven, serverless, hexagonal
2. **Module boundaries** — list each module, its responsibility, its files
3. **Data flow** — trace a complete request: (FE event) → (API call) → (route handler) → (service) → (DB) → (response) → (FE state update)
4. **Dependency graph** — which modules import/depend on which. Identify:
   - Circular dependencies
   - Deep dependency chains
   - Unused dependencies
5. **State management (frontend)** — Redux, Zustand, Context, local state, URL state. Identify inconsistencies in state architecture.
6. **Routing structure (frontend)** — protected vs public routes, role-based access, nested layouts

### 1.2 Coupling Assessment

| Coupling Type | Severity | Location | Evidence | Impact |
|---------------|----------|----------|----------|--------|
| Tight coupling between layers | H/M/L | `path/to/file.ts` | Service imports UI types | Changes ripple across layers |
| Circular dependency | H/M/L | `path/to/file.ts` | Module A imports B, B imports A | Breaks tree-shaking, hard to test |
| God object / god class | H/M/L | `path/to/file.ts` | > 500 lines, > 10 responsibilities | Hard to reason about, test, change |
| Implicit dependency | H/M/L | `path/to/file.ts` | Relies on global state without declaring it | Unclear contracts, easy to break |

### 1.3 Code Organization Issues
- Files in wrong directories (e.g., API calls in UI components, business logic in route handlers)
- Mixed responsibilities within a single file
- Overly nested directory structures (> 5 levels deep)
- Flat structures lacking any organization (> 20 files in one directory)
- Missing index.ts/barrel files

**Output:** Structured architecture report saved to `docs/architecture/<prefix>-arch-audit-<date>.md`. **DO NOT modify any code in this phase.**

---

## Phase 2: Bug Detection & Fixing

### 2.1 Backend Bug Scan
Check EVERY file for:

**Async Issues:**
- Unawaited promises (no `await` or `.catch`)
- Promise chains without error handler
- `try/catch` swallowing errors (empty catch block or just `console.error`)
- Mixing `.then()` and `await` inconsistently
- Goroutine leaks (no waitgroup/context cancellation)
- Blocking the event loop in Node.js (synchronous I/O in async path)

**Null/Undefined Errors:**
- Missing null checks before property access
- Optional chaining opportunities (`?.` not used where applicable)
- Nil pointer dereference risks (Go, C#)
- Function parameters not validated for null/undefined
- Array access without bounds check

**Race Conditions:**
- Shared mutable state without synchronization
- Concurrent writes to same file/database record
- Check-then-act patterns without atomicity
- Stale closure values in callbacks

**Error Handling:**
- Swallowed errors (empty `catch {}`)
- Unhandled promise rejections
- Generic error messages exposed to clients
- Error responses missing status codes or structured format
- Missing cleanup in error paths (DB connections, file handles)

**API Contract Issues:**
- Response shape doesn't match documented format
- Missing fields in some code paths
- Inconsistent error response format across endpoints
- Missing HTTP status codes (always 200 even on errors)
- No input validation (or validation bypassable)

**Resource Leaks:**
- Database connections not closed/released
- File handles not closed
- HTTP connections not closed
- Timers/intervals not cleared
- Event listeners not removed

### 2.2 Frontend Bug Scan
**State Issues:**
- State mutation instead of immutability
- Stale state (closures capturing old values)
- Unsynchronized state managers (Context + Redux for same data)
- Incorrect state initializations (null initial state leading to crashes)

**Lifecycle Issues:**
- Missing cleanup in `useEffect` (subscriptions, timers left running)
- Infinite re-render loops (state set in render, missing deps in useEffect)
- `useEffect` missing dependencies (stale closures)
- `useEffect` with incorrect dependency arrays (unnecessary re-runs)

**Event Handling:**
- Event handler attached multiple times (no cleanup)
- Missing `preventDefault()` on form submissions
- Incorrect event propagation (stopPropagation where not needed)
- Double-firing events

**Rendering Issues:**
- Missing unique keys in lists (using index instead of stable id)
- Conditional rendering that causes layout shift
- Fragment misuse (unnecessary wrappers)
- Portal cleanup issues

**Form Issues:**
- Mixed controlled/uncontrolled inputs
- Validation timing (validating before user interaction)
- Default values not matching expected types
- Form state not reset on submission

### 2.3 General Bug Scan
- Off-by-one errors in loops and array access
- Type coercion issues (`==` vs `===`, string/number comparisons)
- Incorrect comparison operators (`=` vs `==`, `<` vs `<=`)
- Dead/unreachable code paths
- Integer overflow / floating point precision
- Incorrect timezone handling
- Encoding/decoding mismatches

### 2.4 Fix Protocol
```
1. MINIMAL CHANGE — fix the bug, do NOT refactor the surrounding code
2. ADD A TEST (if test framework exists) that would catch this bug
3. VERIFY — run the affected module's tests
4. DOCUMENT — log what was wrong and what fixed it
5. COMMIT per bug — one atomic change per bug fix
```

---

## Phase 3: Performance Optimization

### 3.1 Backend Performance Scan
**Database:**
- N+1 queries (lazy loading triggering repeated queries)
- Missing indexes on frequently queried columns
- Full table scans on large tables
- Fetching unnecessary columns (`SELECT *` when 3 columns needed)
- Missing query pagination on list endpoints
- Inefficient JOINs (joining tables unnecessarily)

**Computation:**
- Same computation repeated in loops (hoist it)
- Expensive operations in hot paths (regex, serialization)
- Redundant API calls (same data fetched multiple times)
- Cacheable results not cached

**Blocking & I/O:**
- Blocking the event loop (Node.js synchronous file ops)
- Synchronous HTTP calls in async context
- Unnecessary serialization/deserialization
- Large file reads without streaming
- Missing connection pooling

### 3.2 Frontend Performance Scan
**Rendering:**
- Unnecessary re-renders (parent re-renders whole tree)
- Missing `React.memo` / `useMemo` / `useCallback` on expensive components
- Inline function/object creation in render (new references every render)
- Large lists without virtualization

**Bundle:**
- Large imports from libraries (importing entire library when only one function needed)
- Missing code splitting / lazy loading for routes
- Unused imports (dead code)
- Missing tree-shaking configuration

**API Calls:**
- Missing debounce on search inputs
- Missing throttle on scroll/resize handlers
- Waterfall requests (sequential API calls that could be parallel)
- Data fetched that is never rendered

**Assets:**
- Unoptimized images (no compression, wrong format)
- Missing lazy loading for images below the fold
- Large font files not subsetted

### 3.3 Optimization Protocol
```
1. PROFILE first — never optimize based on assumptions
2. MEASURE the bottleneck with actual data/profiling tools
3. APPLY the optimization — one at a time
4. RE-MEASURE — confirm the improvement
5. SKIP micro-optimizations — if the gain is < 5%, note it but don't implement
6. DOCUMENT tradeoffs — if optimization adds complexity, document why it's worth it
```

---

## Phase 4: Security Hardening

### 4.1 Backend Security Scan
**Injection Prevention:**
- SQL injection: raw string concatenation in queries — use parameterized queries/ORM
- NoSQL injection: unvalidated operators in MongoDB queries
- Command injection: user input passed to `exec()`, `shell()`, `spawn()`
- LDAP injection, XML injection if applicable

**Authentication:**
- Weak password policies (no min length, no complexity requirements)
- Token handling (JWT secrets hardcoded, tokens in URLs, no expiry)
- Session management (no rotation, no invalidation on logout)
- Missing rate limiting on login endpoints
- No brute force protection

**Authorization:**
- Missing role/permission checks on protected endpoints
- Insecure direct object references (IDOR) — user A can access user B's data
- Missing input ownership validation
- Privilege escalation paths (regular user can access admin functions)

**API Security:**
- CORS misconfigured (too permissive: `*` with credentials)
- Missing HTTPS enforcement
- No request size limits
- No rate limiting on any endpoint
- No CSRF protection on state-changing endpoints

**Data Exposure:**
- Sensitive data in logs (passwords, tokens, PII)
- Stack traces exposed in error responses
- PII in URL parameters
- Secrets hardcoded in source code
- Missing encryption for sensitive fields at rest

### 4.2 Frontend Security Scan
**XSS Prevention:**
- `dangerouslySetInnerHTML` / `innerHTML` usage
- Unsanitized user content rendered directly
- Script injection via URL parameters
- Markdown rendered without sanitization

**CSRF:**
- Missing CSRF tokens on form submissions
- Cookie security flags missing (`httpOnly`, `secure`, `sameSite`)
- API calls that authenticate via cookies without CSRF protection

**Secure Storage:**
- JWTs/auth tokens stored in `localStorage` (XSS-vulnerable)
- Sensitive data in `sessionStorage`
- API keys exposed to client side

**Security Headers:**
- Missing Content-Security-Policy header
- Missing X-Content-Type-Options
- Missing X-Frame-Options

### 4.3 Security Fix Protocol
```
CRITICAL (fix immediately):
- Remote code execution, SQL injection, auth bypass
- Sensitive data exposure (passwords, PII, tokens)
- Privilege escalation

HIGH (fix in current session):
- Injection vulnerabilities (NoSQL, command, LDAP)
- Missing authentication on protected endpoints
- Insecure direct object references
- CSRF on state-changing endpoints

MEDIUM (fix if time permits):
- Missing security headers
- Weak password policies
- CORS misconfiguration without evidence of exploitation

LOW (document only):
- Information disclosure via error messages
- Missing input length limits
- Rate limiting improvements
```

---

## Phase 5: Refactoring

### 5.1 Backend Refactoring Patterns
| Pattern | Apply When | Implementation |
|---------|-----------|----------------|
| **Layered architecture** | Controllers contain business logic | Extract services, repositories, DTOs |
| **Middleware extraction** | Cross-cutting concerns in route handlers | Move auth, logging, validation, error handling to middleware |
| **DTO layer** | Raw DB models returned in API responses | Create request/response DTOs, mapping layer |
| **Repository pattern** | Data access mixed with business logic | Abstract DB behind repository interfaces |
| **Strategy pattern** | Multiple algorithms conditionally selected | Extract each algorithm into its own strategy class |
| **Factory pattern** | Complex object creation logic | Extract creation into factory functions/classes |
| **Error handler centralization** | Error handling scattered across endpoints | Create global error handler with consistent format |

### 5.2 Frontend Refactoring Patterns
| Pattern | Apply When | Implementation |
|---------|-----------|----------------|
| **Custom hooks** | Logic duplicated across components | Extract to `useXxx()` hooks |
| **State manager extraction** | State scattered across components | Move to Zustand/Redux/Context slice |
| **Component decomposition** | Single component > 200 lines | Split by responsibility |
| **Container/presentational** | Component mixes data fetching and rendering | Separate data layer from UI |
| **Render props / children** | Components sharing same layout pattern | Extract layout wrapper |
| **Compound components** | Complex multi-part UI (Table, Tabs, Form) | Build composed API with Context |

### 5.3 General Refactoring
- **Naming audit** — every variable, function, class, file should have a self-documenting name
- **Duplication removal** — 3+ repetitions → extract to shared utility
- **Large file splitting** — files > 300 lines → split by responsibility
- **Large function splitting** — functions > 50 lines → split into smaller focused functions
- **Complexity reduction** — nested conditionals > 3 levels → extract to early returns or guard clauses
- **Single responsibility** — every module/function should have ONE clear purpose

### 5.4 Refactoring Safety Protocol
```
1. UNDERSTAND fully before touching — read the entire module first
2. WRITE TESTS FIRST for the behavior you're refactoring (if no tests exist)
3. ONE change at a time — commit after each logical unit
4. RUN TESTS after each change — if they fail, REVERT (do not patch around)
5. DO NOT refactor and fix bugs in the same change — these are separate phases
6. DO NOT reformat files — respect existing formatting (prettier/eslint will handle this)
7. If in doubt — ASK the user before making architectural decisions
```

---

## Phase 6: Cross-Layer Consistency

### 6.1 API Contract Alignment
1. **Map all endpoints** — create a table of every API route with request shape + response shape
2. **Compare frontend expectations vs backend reality** — find mismatches:
   - Frontend expects field `createdAt` but backend returns `created_at`
   - Frontend expects `{ data: T }` but backend returns `T` directly
   - Frontend expects array but backend returns null for empty results
3. **Unify error format** — all endpoints must return:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Human-readable description",
       "details": {} | null
     }
   }
   ```
4. **Unify pagination** — all paginated endpoints use same format:
   ```json
   {
     "data": [],
     "pagination": {
       "page": 1,
       "pageSize": 20,
       "total": 100,
       "totalPages": 5
     }
   }
   ```
5. **Unify date format** — ISO 8601 everywhere, UTC timezone

### 6.2 Type Consistency
- **Shared types** — if frontend and backend are in same repo, extract shared type definitions
- **API client generation** — if OpenAPI/Swagger spec exists, generate client types or verify alignment
- **Validation schemas** — zod (TS), pydantic (Python), serde (Rust) on both request and response
- **Null handling** — consistent policy: are missing values `null`, `undefined`, or omitted?

### 6.3 Naming Convention Alignment
- Frontend API functions named after the endpoints they call
- Frontend model type names match backend response type names
- Error codes and messages consistent across frontend and backend
- Enums/constants defined once, shared where possible

---

## Phase 7: Testing & Verification

### 7.1 Testing Strategy
| Test Type | Coverage Target | When to Add |
|-----------|----------------|-------------|
| **Unit tests** | 80%+ for core business logic | For any new/extracted function |
| **Integration tests** | Happy path + 2 error cases per endpoint | For any changed API endpoint |
| **Regression tests** | Bug-specific: test that catches the bug | For every bug fixed |
| **Type check** | 0 errors | Always — `npx tsc --noEmit` |

### 7.2 Testing Protocol
```
For each change:
1. Run existing tests before change → confirm baseline passes
2. Add test for new behavior (or fix behavior)
3. Run tests again → confirm still passing
4. If existing tests fail → REVERT the change, not the tests

Do NOT:
- Delete or modify failing tests to make CI pass
- Add `skip` or `only` to tests
- Ignore flaky tests — investigate and fix
```

### 7.3 Verification Checklist (MANDATORY before completing)
- [ ] **Build passes** — `npm run build` / `go build` / `dotnet build` — exit code 0
- [ ] **All tests pass** — same count as baseline (or more, never less)
- [ ] **Linter passes** — 0 NEW errors (pre-existing errors documented in baseline)
- [ ] **Type checker passes** — 0 new type errors
- [ ] **LSP diagnostics clean** — 0 errors on ALL changed files
- [ ] **No debugging artifacts** — no `console.log()`, `debugger`, `print()` committed
- [ ] **No TODOs/FIXMEs** left in changed code (unless deliberate and documented)
- [ ] **No type suppressions** — no `as any`, `@ts-ignore`, `@ts-expect-error` added
- [ ] **Baseline unchanged** — pre-existing errors/docs/lint warnings still at baseline count

---

## Phase 8: Documentation & Reporting

### 8.1 Per-Phase Report Format
For each phase completed, produce:

```markdown
## Audit Phase: [Phase Name]
**System:** [prefix]
**Completed:** [ISO 8601 date]

### Findings
| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 1 | High | `src/auth/login.ts:42` | Async race condition on token refresh | Fixed |
| 2 | Medium | `src/api/users.ts:15` | Missing input validation on email | Fixed |
| 3 | Low | `src/utils/format.ts:88` | Duplicate date formatting logic | Noted |

### Changes Made
| File | Added | Removed | Change |
|------|-------|---------|--------|
| `src/auth/login.ts` | +15 | -3 | Added mutex guard around token refresh |

### Verification
- [ ] Tests: N/N passing
- [ ] Build: exit code 0
- [ ] Linter: 0 new errors
- [ ] LSP: 0 errors on changed files
```

### 8.2 Documentation Updates (Per project-rules Rules 1, 4, 5)
1. **Update CHANGELOG.md** — add entry for each phase completed:
   ```markdown
   ### Audit: [Phase] — [Date]
   - [Summary of findings and changes]
   ```
2. **Update README.md** — add audit report link to "Project Documentation" section per Rule 5
3. **Save phase report** — `docs/audits/<prefix>-audit-<date>-<phase>.md`
4. **Update version** — bump version per project-rules Rule 8 Decision Matrix

### 8.3 Final Summary
After ALL phases complete:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 AUDIT & REFACTOR SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Project:   <project name>
  Duration:  <total time>
  Baseline:  <date>

  Phases Completed:
  ✅ Phase 0: Pre-flight assessment
  ✅ Phase 1: Architecture analysis
  ✅ Phase 2: Bug fixes
  ✅ Phase 3: Performance optimization
  ✅ Phase 4: Security hardening
  ✅ Phase 5: Refactoring
  ✅ Phase 6: Cross-layer consistency
  ✅ Phase 7: Testing & verification
  ✅ Phase 8: Documentation & reporting

  Bug fixes:      <N> found, <M> fixed, <K> noted
  Performance:    <N> optimizations applied
  Security:       <N> vulnerabilities fixed
  Refactors:      <N> modules refactored
  Tests added:    <N> new tests

  Files changed:  <N>
  Lines added:    <N> | Lines removed: <N>
  Version:        <before> → <after>

  Reports saved:  docs/audits/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Global Rules (Non-Negotiable)

```
┌─────────────────────────────────────────────────────────┐
│               GLOBAL EXECUTION RULES                     │
│  These apply to ALL phases. DO NOT violate.              │
└─────────────────────────────────────────────────────────┘

1. SAFETY
   ◻ Never break existing functionality
   ◻ Never refactor and fix bugs in the same change
   ◻ Never leave code in a broken state
   ◻ If the build breaks → REVERT immediately

2. TRACEABILITY
   ◻ Every change must be explainable in plain language
   ◻ Every fix must reference the bug condition it fixes
   ◻ Every optimization must reference the profiled/observed bottleneck
   ◻ Every type suppression (as any, @ts-ignore) is FORBIDDEN

3. INCREMENTAL WORK
   ◻ One phase at a time — do not skip ahead
   ◻ One module at a time within each phase
   ◻ Verify after each change (build + test)
   ◻ Commit per logical unit of work

4. ROLLBACK PROTOCOL
   ◻ If tests fail after a change → REVERT the change
   ◻ If build breaks after a change → REVERT the change
   ◻ If linter introduces new errors → REVERT the change
   ◻ NEVER "patch around" a broken change — revert and fix properly

5. TYPE SAFETY
   ◻ Never use `as any`, `@ts-ignore`, `@ts-expect-error` to suppress types
   ◻ Never use `any` or `object` when a specific type exists
   ◻ Always add type definitions for any untyped public API
   ◻ Fix type errors — do not suppress them

6. CODE QUALITY
   ◻ Prefer readability over cleverness (one-liners, nested ternaries)
   ◻ Favor explicit over implicit (no magic numbers, implicit globals)
   ◻ Follow existing patterns if the codebase is CONSISTENT
   ◻ If codebase is INCONSISTENT → propose a pattern, ask user, do not choose randomly

7. DEPENDENCIES
   ◻ Do NOT add new dependencies without explicit justification in the commit message
   ◻ Do NOT remove dependencies without checking all references
   ◻ If a dependency is outdated and insecure → propose an upgrade (do not upgrade silently)
   ◻ Lock file changes must be intentional and explained

8. WHEN IN DOUBT
   ◻ If unsure about a change → document the uncertainty and move on
   ◻ If a change requires an architectural decision → ask the user
   ◻ If code contradicts itself → ask which pattern to follow
   ◻ If requirements are unclear → ask before implementing

9. RESPECT EXISTING CONFIGURATION
   ◻ Follow linter rules — do not disable them per-file
   ◻ Follow formatter config — do not reformat entire files
   ◻ Respect tsconfig strictness settings
   ◻ Do not change project configuration without explicit justification
```

---

## Quick Reference Card

```
AUDIT & REFACTOR — COMPLETE CHECKLIST

PHASE 0: PRE-FLIGHT (MANDATORY)
□ Project size classified (small/medium/large)
□ Full tech stack documented
□ Test baseline captured (N passing, N failing)
□ Build baseline verified (exit code)
□ Linter baseline captured
□ Exclusion zones defined and communicated
□ Rollback strategy confirmed

PHASE 1: ARCHITECTURE ANALYSIS
□ Architecture pattern identified and documented
□ Module boundaries mapped
□ Dependency graph with circular deps noted
□ Coupling issues identified (tight, implicit, god objects)
□ Report saved — NO code changes made

PHASE 2: BUG FIXING
□ Backend scanned: async, null, race conditions, error handling, resource leaks
□ Frontend scanned: state, lifecycle, events, rendering, forms
□ Each bug: MINIMAL fix + test + verification
□ No refactoring during bug fixes

PHASE 3: PERFORMANCE
□ Backend: DB queries, computation, caching, I/O scanned
□ Frontend: re-renders, bundle, API calls, assets scanned
□ Each optimization: profiled → applied → re-measured
□ Micro-optimizations SKIPPED (documented but not implemented)

PHASE 4: SECURITY
□ Backend: injection, auth, authorization, API security, data exposure scanned
□ Frontend: XSS, CSRF, storage, headers scanned
□ Critical vulnerabilities: FIXED IMMEDIATELY
□ Each fix severity-classified (Critical/High/Medium/Low)

PHASE 5: REFACTORING
□ Logic separated from UI/controllers
□ Naming audit completed
□ Duplication removed (3+ repetitions → shared utility)
□ Large files/functions split
□ Refactoring Safety Protocol followed (tests first, one change at a time)

PHASE 6: CROSS-LAYER
□ API contract alignment verified (endpoint map created)
□ Error format unified
□ Pagination format unified
□ Date format unified
□ Type definitions aligned frontend↔backend

PHASE 7: TESTING & VERIFICATION
□ Build passes (exit code 0) — verified
□ All tests pass (baseline count maintained or increased)
□ Linter: 0 new errors
□ Type checker: 0 new errors
□ LSP diagnostics: 0 errors on changed files
□ No console.log / debugger artifacts
□ No type suppressions (as any, @ts-ignore)

PHASE 8: DOCUMENTATION
□ Per-phase audit reports written (docs/audits/)
□ CHANGELOG.md updated
□ README.md documentation index updated
□ Final summary presented to user
□ Version bumped per project-rules Rule 8
```

---

## Phase Dependency Graph

```
Phase 0: Pre-flight
   │
   ▼
Phase 1: Architecture Analysis
   │
   ▼
Phase 2: Bug Fixing
   │
   ├─────────────────▶ Phase 3: Performance (independent, can parallel)
   │
   ├─────────────────▶ Phase 4: Security (independent, can parallel)
   │
   ▼
Phase 5: Refactoring (depends on Phases 2-4)
   │
   ▼
Phase 6: Cross-Layer Consistency
   │
   ▼
Phase 7: Testing & Verification
   │
   ▼
Phase 8: Documentation & Reporting
```

**Parallel execution note:**
- Phases 2, 3, and 4 are INDEPENDENT and can run in parallel across different modules
- Phase 5 depends on all of 2-4 (don't refactor code that might change from a bug fix)
- Each phase can be run independently on a subset of modules following prompt-rules system filtering

---

## Enforcement

These rules MUST be followed for:
- Any full-project audit or code review
- Any security audit or performance audit
- Any major refactoring effort
- Any bug-fixing campaign across multiple modules

**Deviation requires explicit user approval.**

**System prefix MUST match the project's README.md System Prefix Table (project-rules Rule 9).**
**All reports use Markdown format (project-rules Rule 6).**
**Version bumped after audit completion (project-rules Rule 8).**

---

## Version History

| Version | Build | Changes |
|---------|-------|---------|
| v1.0 | 001 | Initial creation — Phases 0-8 complete methodology for holistic code audit, bug fixing, performance optimization, security hardening, refactoring, and documentation |
