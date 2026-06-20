# Runbook: Operations

Operational procedures for the SMS Monitor v2.0 stack. Each procedure is a single, runnable document.

| Procedure | Doc | When to use |
|---|---|---|
| Pre-release smoke test | [`02-smoke-test.md`](./02-smoke-test.md) | Before tagging any release |
| Run the e2e suite | [`03-run-e2e.md`](./03-run-e2e.md) | To verify Sprint 1's auth + tenants code works at runtime |

---

## Adding a new procedure

1. Create `docs/runbooks/<procedure-name>.md` with a one-line summary, a `When to use` section, and the step-by-step
2. Add a row to the table above (alphabetical)
3. Add the file to the README's "Project Documentation" index per project-rules Rule 5

## Runbook template

```markdown
# Runbook: <Procedure Name>

**When to use:** <one-line trigger>

## Prerequisites
- <thing 1>
- <thing 2>

## Steps
1. <step>
2. <step>

## Pass criteria
- <criterion>

## Fail handling
- <what to do if it breaks>

## Post-... cleanup
- <rollback steps>
```
