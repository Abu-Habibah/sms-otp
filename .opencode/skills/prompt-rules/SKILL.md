---
name: prompt-rules
version: v1.1 (Build: 002)
description: Prompt generation and execution management. Use when generating prompts for tasks, executing pending prompts, running tasks in batch, or creating agent-consumable prompt documents. Triggers: 'generate prompt for', 'create a prompt', 'execute task', 'go with your task', 'execute all tasks', 'run prompt'.
install_prompt: INSTALL_PROMPT.md
related_skills:
  - project-rules
  - holistic-audit-refactor
---

# Prompt Rules - Structured Prompt Generation & Execution

## System Prefix Dependency (CRITICAL)

This skill **does NOT define its own system prefix table**. All `system` fields in generated prompts and execution reports reference the authoritative **System Prefix Table** defined by the `project-rules` skill (Rule 9: Sprint & Task File Naming Convention).

**Before assigning any `system` value:**

1. Read README.md's "System Prefixes" table (maintained by project-rules Rule 9)
2. Verify the target system's prefix exists in that table
3. If the system does NOT exist → add it to the System Prefix Table first (per project-rules Rule 9)
4. Use ONLY prefixes from that table

**Prompt naming follows project-rules Rule 9 format:**
```
<prefix>-prompt-<name>-v<N>.md
```

**Examples (matching existing System Prefix Table):**
| System Prefix | Prompt ID |
|---------------|-----------|
| `be` | `be-prompt-create-auth-api-v1.md` |
| `web` | `web-prompt-login-page-v1.md` |
| `db` | `db-prompt-user-migration-v1.md` |
| `shared` | `shared-prompt-api-contracts-v1.md` |

**The `shared` prefix applies when a prompt spans multiple systems** — consistent with project-rules Rule 9.

**Deviation from this naming convention requires explicit user approval.**

---

## Session System Assignment (CRITICAL)

When a user assigns a session to a specific system, this MUST be tracked in machine-readable format to prevent cross-system execution errors.

### When Triggered
User says any of:
- `"you are responsible for [SYSTEM] tasks only"`
- `"only handle [SYSTEM] prompts"`
- `"this session is for [SYSTEM]"`
- `"focus on [SYSTEM]"`
- `"you are the [SYSTEM] agent"`

### Actions Required

#### 1. Extract System Prefix
1. **Parse** user instruction for system reference
2. **Match** to existing prefix in README.md System Prefix Table
3. **If no match** → ask user to clarify or add system to prefix table first

#### 2. Write Session State
Create/update `.sisyphus/session-state.json`:

```json
{
  "session_id": "<current session ID>",
  "assigned_system": "<prefix from System Prefix Table>",
  "assigned_at": "<ISO 8601 timestamp>",
  "assigned_by": "user instruction",
  "original_instruction": "<verbatim user instruction>"
}
```

#### 3. Confirm Assignment
Output to user:
```
✅ SESSION SYSTEM ASSIGNED

  Session:   <session_id>
  System:    <prefix> (<system description from prefix table>)
  Assigned:  <timestamp>
  
  This session will only execute prompts targeting: <prefix>
  To override: "override system assignment to [prefix]"
```

### Override Mechanism

If user wants to execute a prompt for a different system than assigned:

1. User says: `"override system assignment to [prefix]"`
2. Update `.sisyphus/session-state.json` with new assignment
3. Log override event with reason
4. Proceed with execution

### State File Location

```
.sisyphus/session-state.json
```

**Do NOT store session state in:**
- `docs/` (documentation only)
- `src/` (source code only)
- Root directory (config only)

---

## Rule 1: Prompt Generator

### Context
Agents perform better when given structured, self-contained task prompts with clear acceptance criteria, constraints, and context. The Prompt Generator transforms raw user input ("build login API") into comprehensive, agent-ready prompt documents that any agent can consume independently.

### When Triggered
User says any of:
- `"generate prompt for [task]"`
- `"create a prompt for [task]"`
- `"write a prompt to build [task]"`
- `"generate task prompt [task]"`

### Actions Required

#### Phase 1: Analyze
1. **Extract** — task description, target system, scope boundaries from user input
2. **Identify** — dependencies on other prompts, existing code references, knowledge gaps
3. **Determine** — best `agent_type` for execution based on task complexity:
   | Task Type | agent_type |
   |-----------|-----------|
   | Autonomous research + implementation | `deep` |
   | Hard logic, architecture, algorithms | `ultrabrain` |
   | Frontend, UI, styling, design | `visual-engineering` |
   | Trivial single-file changes | `quick` |
   | General multi-step tasks | `general` |
   | Codebase exploration/search | `explore` |
4. **Check** — scan `docs/prompts/generated/` for duplicate/similar prompts (avoid redundancy)

#### Phase 2: Resolve System Prefix
1. **Read** README.md "System Prefixes" table (project-rules Rule 9)
2. **Match** the target system to an existing prefix
3. **If no match** → ask user to define the system prefix OR add it to the table
4. **Generate prompt_id**: `<system-prefix>-prompt-<slug>-v<N>`
   - `<slug>`: kebab-case, max 5 words, describes the task
   - `<N>`: auto-increment starting at 1 for new task names; increment for revisions

#### Phase 3: Generate
Fill the canonical template (`docs/prompts/templates/shared-prompt-template.md`) completely:

**Mandatory sections — none may be empty:**
1. **YAML Frontmatter** — system, prompt_id, generated_at, generated_from, status, agent_type, dependencies, related_prompts, estimated_effort, priority, tags
2. **System Target** — which system, which agent type, why that agent type, priority with justification
3. **Objective** — 1-2 sentences defining "done"
4. **Context** — background, existing patterns, relevant docs with relative links, architectural constraints
5. **Task Description** — numbered, concrete actions with expected outcomes
6. **Acceptance Criteria** — each criterion MUST include a verification method (test command, manual check, file assertion)
7. **Constraints** — what NOT to do, files NOT to touch, patterns to follow (with file references), libraries/tools to use or avoid
8. **Required Files** — table with file path, action (CREATE/MODIFY/REFERENCE), and purpose
9. **Expected Deliverables** — each with file path + success condition
10. **Agent Instructions** — approach suggestions, order of operations, debugging tips, known pitfalls
11. **Notes** — scope boundaries, future work, related tickets, gotchas

**Acceptance criteria quality gate:**
Reject any criterion that is vague. Every criterion must answer "How do I verify this?"
- ❌ BAD: "Login works correctly"
- ✅ GOOD: "Login returns 200 with JWT in httpOnly cookie — verify via `curl -X POST /api/auth/login`"

#### Phase 4: Save
1. **Write** to `docs/prompts/generated/<system>/<prompt_id>.md`
2. **Set frontmatter** — `status: pending`, `generated_at: <ISO 8601 now>`, `generated_from: "<verbatim user input>"`
3. **Create** parent directories if missing (e.g., `docs/prompts/generated/be/`)

#### Phase 5: Index
1. **Update** `docs/prompts/INDEX.md` — add entry to "Pending" section with all frontmatter fields
2. **Update** README.md "📝 Prompts & Task Management" section — add link (per project-rules Rule 5)

#### Phase 6: Report
Output to user:
```
✅ PROMPT GENERATED

  Prompt ID:  <prompt_id>
  System:     <prefix> (<system description from prefix table)
  Agent:      <agent_type> (<why>)
  Priority:   <P0/P1/P2>
  Effort:     <estimated_effort>
  File:       docs/prompts/generated/<system>/<prompt_id>.md
  Status:     pending

  Dependencies:  <list or "none">
  Blocks:        <prompts that depend on this, if any>

  Execute with: "execute all tasks" or "execute <prompt_id>"
```

### Quick Reference Card

```
PROMPT GENERATOR - CHECKLIST:
□ User intent extracted (task, system, scope)
□ System prefix validated against README.md prefix table
□ prompt_id format: <prefix>-prompt-<slug>-v<N>
□ Agent type selected (deep/ultrabrain/visual-engineering/quick/general/explore)
□ Duplicate check: no existing prompt for same task
□ Template: all 11 sections filled (none empty)
□ Acceptance criteria: ALL verifiable (includes "how to verify")
□ Constraints: what NOT to do explicitly stated
□ File saved: docs/prompts/generated/<system>/<prompt_id>.md
□ Frontmatter: status=pending, generated_at set, generated_from set
□ INDEX.md updated (Pending section)
□ README.md updated (📝 Prompts section)
□ User notified with summary
```

---

## Rule 2: Prompt Executor

### Context
Pending prompts accumulate in `docs/prompts/generated/`. The Prompt Executor discovers ALL pending prompts, resolves dependency order, batch-executes them with appropriate agents, and produces execution reports with verification evidence.

### When Triggered
User says any of:
- `"execute task"`
- `"go with your task"`
- `"execute all tasks"`
- `"run prompt [name]"`
- `"execute prompt [name]"`
- `"start task"`
- `"execute all pending"`

### Actions Required

#### Phase 0: Pre-Execution Validation (MANDATORY)

Before executing ANY prompt, validate system assignment and file existence. **Do NOT proceed to Phase 1 until all validations pass or user explicitly overrides.**

##### 1. Session System Check
1. **Read** `.sisyphus/session-state.json` if it exists
2. **Extract** `assigned_system` field
3. **If file doesn't exist** → proceed with WARNING (no system assigned)
4. **Compare** prompt's `system` field with `assigned_system`
5. **If mismatch** → **BLOCK execution** with:

```
❌ EXECUTION BLOCKED — SYSTEM MISMATCH

Prompt targets:  <prompt_system> (<system description>)
Session assigned: <assigned_system> (<system description>)

This session is assigned to handle '<assigned_system>' tasks only.
The prompt '<prompt_id>' targets a different system.

Options:
1. Execute this prompt in a session assigned to '<prompt_system>'
2. Override this session's assignment: "override system assignment to <prompt_system>"
3. Cancel execution
```

6. **If no session state file** → proceed with WARNING:

```
⚠️ WARNING: No session system assignment

This session has no system assignment recorded.
Prompt targets: <prompt_system>

Recommendation: Assign this session first with:
"you are responsible for <prompt_system> tasks only"

Proceed anyway? [y/N]
```

##### 2. System Prefix Validation
1. **Read** README.md "System Prefixes" table (project-rules Rule 9)
2. **Verify** prompt's `system` field exists in that table
3. **If NOT found** → **BLOCK execution** with:

```
❌ EXECUTION BLOCKED — SYSTEM NOT FOUND

Prompt targets system: '<prompt_system>'
This system does NOT exist in current project's System Prefix Table.

Either:
1. Add the system to README.md first (per project-rules Rule 9)
2. Execute this prompt in the correct project
3. Override with: "force execute <prompt_id>"
```

##### 3. File Existence Check
1. **Read** prompt's "Required Files" section
2. **For each file** with action=MODIFY or action=REFERENCE:
   - Check if file exists in current project
   - If NOT found → **WARN user**:

```
⚠️ WARNING: File not found

File: <file_path>
Action: <MODIFY|REFERENCE>
Expected by prompt: <prompt_id>

This prompt expects to modify/reference this file, but it doesn't exist.

Options:
1. Create the file first (run prerequisite prompt)
2. Skip this prompt
3. Proceed anyway (agent will create from scratch)
```

3. **For each file** with action=CREATE:
   - Check if parent directory exists
   - If NOT found → **WARN user**:

```
⚠️ WARNING: Parent directory not found

Directory: <parent_directory>
File to create: <file_path>

The parent directory doesn't exist. Agent will create it.

Proceed? [y/N]
```

##### 4. Cross-Project Detection
1. **Read** prompt's `generated_from` path
2. **Compare** with current project root path
3. **If different** → **WARN user**:

```
⚠️ WARNING: Cross-project execution detected

This prompt was generated for: <original_project_path>
Current project: <current_project_path>

File paths and system prefixes may not match.

Options:
1. Execute in the original project instead
2. Override and execute here: "force execute <prompt_id>"
3. Cancel
```

##### 5. Validation Summary

After all checks, present summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ PRE-EXECUTION VALIDATION PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session system:     <assigned_system> ✓
Prompt system:      <prompt_system> ✓
System prefix:      Found in README.md ✓
Required files:     <N> exist, <M> will be created ✓
Cross-project:      Same project ✓

Proceeding to execution plan...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Do NOT skip Phase 0.** Even if user says "just execute it", run validation first.

---
#### Phase 1: Discover All Pending

1. **Scan** `docs/prompts/generated/**/*.md` recursively
2. **Parse** YAML frontmatter from each file
3. **Filter** to `status: pending` only
4. **Filter by session system** (NEW):
   - Read `.sisyphus/session-state.json` if exists
   - If `assigned_system` is set → keep only prompts where `system == assigned_system`
   - If no session state → keep all prompts (with warning)
   - Log how many prompts filtered out (for transparency)
5. **If single prompt specified** (e.g., "execute be-prompt-auth-v1") → skip to Phase 4
6. **If zero pending** → report: "No pending prompts for system '<assigned_system>'"

**Filtering example:**
```
Session assigned to: be
Discovered: 5 pending prompts (be: 2, web: 2, db: 1)
After filter: 2 prompts (be only)
Filtered out: 3 prompts (web: 2, db: 1)
```

#### Phase 2: Resolve Execution Order
1. **Build dependency graph** from each prompt's `dependencies` field
2. **Topological sort** — prompts must execute AFTER their dependencies complete
3. **Identify parallel batches** — prompts at the same dependency level on different systems can run in parallel:
   | Same dep level? | Same system? | Action |
   |-----------------|-------------|--------|
   | Yes | Different | **PARALLEL** (safe) |
   | Yes | Same, different files | **PARALLEL** (likely safe) |
   | Yes | Same, overlapping files | **SEQUENTIAL** (conflict risk) |
4. **Order by priority** within each batch (P0 before P1 before P2)

#### Phase 3: Present Execution Plan
Show the user a clear plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 EXECUTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found <N> pending prompts across <M> systems.

Batch 1 (parallel — no deps):
  [1] <prompt_id> ........ <priority> · <effort>
  [2] <prompt_id> ........ <priority> · <effort>

Batch 2 (after batch 1):
  [3] <prompt_id> ........ <priority> · <effort> (needs #1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimated total: <Xh> (<Ys> sequential, <Zp> parallel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with execution?
```

**WAIT for user confirmation before proceeding.** Do not auto-execute.

#### Phase 4: Execute (Batch by Batch)
For each batch, for each prompt in the batch:

1. **Mark** prompt frontmatter: `status: in_progress`
2. **Read** the full prompt file into context
3. **Delegate** to the specified `agent_type` agent:

```
task(
  category="<prompt.agent_type>",
  load_skills=["project-rules"],
  run_in_background=false,
  prompt="[Read and execute this prompt in full: <prompt_id>.md]
  
  You are executing the prompt defined at docs/prompts/generated/<system>/<prompt_id>.md.
  
  TASK: <extracted Objective>
  SYSTEM: <extracted System Target>
  CONTEXT: <extracted Context>
  TASK STEPS: <extracted Task Description>
  ACCEPTANCE CRITERIA: <extracted list>
  CONSTRAINTS: <extracted list>
  REQUIRED FILES: <extracted table>
  EXPECTED DELIVERABLES: <extracted list>
  NOTES: <extracted Notes>
  
  On completion, report back with: what was done, files changed, verification results, 
  issues encountered. Format your report per the execution-report template."
)
```

4. **Monitor** via todos until agent completes
5. **On completion** — generate execution report (Phase 5)
6. **Parallel within batch** — launch all batch prompts simultaneously via `run_in_background=true`, collect results after all complete

**Failure handling:**
- Any prompt fails → **pause the batch**, report the failure, ask user: continue/skip/abort
- Blocked prompts (dependency failed) → **skip**, report in final summary
- Never leave prompts in `in_progress` state on failure → mark `failed`

#### Phase 5: Report (per prompt)
After each prompt completes:

1. **Generate** execution report:
   - Save to: `docs/prompts/reports/<system>/<system>-execution-report-<name>-v<N>.md`
   - Follow the execution report template (below)
2. **Update** prompt frontmatter: `status: completed` or `status: failed`
3. **Update** `docs/prompts/INDEX.md` — move from Pending to Completed/Failed
4. **Update** README.md (per project-rules Rule 5)
5. **Bump version** per project-rules Rule 8 (Version Bump Decision Matrix)
6. **Update** CHANGELOG.md (per project-rules Rule 1)

#### Phase 6: Final Summary
After ALL batches complete:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 EXECUTION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total:     <N> prompts
  Success:   <S>
  Failed:    <F>
  Skipped:   <K>
  Duration:  <Xh Ym>

  Reports saved to docs/prompts/reports/
  Version bumped: <old> → <new>
  CHANGELOG updated.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Execution Report Template

```markdown
---
system: [prefix from System Prefix Table]
prompt_id: [original prompt_id]
executed_at: [ISO 8601 timestamp]
executed_by: [agent_type used]
duration: [Xh Ym]
status: success | partial | failed
verification: all-checks-passed | partial | failed
---

# Execution Report: [Task Name]

## Summary
- **Prompt:** [[prompt_id]](../generated/[system]/[prompt_id].md)
- **Executed by:** `[agent_type]` agent
- **Status:** [✅ Success | ⚠️ Partial | ❌ Failed]
- **Duration:** [X hours Y minutes]
- **Started:** [ISO 8601]
- **Completed:** [ISO 8601]

## Acceptance Criteria Results
| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | [criterion text from prompt] | ✅ / ❌ | [test name / file path / command output] |

## Changes Made
| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `path/to/file` | CREATE | +NNN | [what was created] |
| `path/to/file` | MODIFY | +N -M | [what was changed] |

## Verification
- [x] Acceptance criteria: [passed]/[total]
- [x] Tests: [passed]/[total] passing
- [x] LSP diagnostics: [N] errors, [N] warnings
- [x] Build: [exit code / status]
- [x] Lint: [N] issues

## Issues Encountered
| Issue | Resolution | Time Cost |
|-------|------------|-----------|
| [problem description] | [how it was resolved] | [minutes] |

## Next Steps
1. [Actionable next step — reference prompt_id if prompt exists]
2. [Actionable next step]

## Lessons Learned
- [What went well / what to improve for future prompts]
```

### Quick Reference Card

```
PROMPT EXECUTOR - CHECKLIST:

PHASE 0: PRE-EXECUTION VALIDATION (MANDATORY)
□ Session system assignment read from .sisyphus/session-state.json
□ Prompt system matches session assignment (or override confirmed)
□ System prefix exists in README.md System Prefix Table
□ Required files exist for MODIFY/REFERENCE actions (or user warned)
□ Parent directories exist for CREATE actions (or user warned)
□ Cross-project detection: same project path (or user warned)
□ Validation summary presented to user

PHASE 1: DISCOVER AND FILTER
□ All pending prompts scanned (docs/prompts/generated/)
□ Session system filter applied (assigned_system from session-state.json)
□ Only prompts matching assigned system retained
□ Filter count logged (discovered: N, kept: M, filtered: K)

PHASE 2-6: EXECUTION
□ Dependency graph built + topologically sorted
□ Parallel batches identified (different systems, no file conflicts)
□ Execution plan presented to user + confirmed
□ Each prompt: status → in_progress before execution
□ Each prompt: delegated to correct agent_type with full context
□ Each prompt: execution report saved to docs/prompts/reports/
□ Each prompt: status → completed or failed
□ Failed prompts: paused, user asked, never left in in_progress
□ Blocked prompts: skipped with reason in summary
□ INDEX.md updated (status changes)
□ README.md updated (per Rule 5)
□ Version bumped (per Rule 8 Decision Matrix)
□ CHANGELOG updated (per Rule 1)
□ Final summary displayed to user
```

```
EXECUTE ALL - PARALLELIZATION RULES:
□ Same dep level + different systems → PARALLEL (safe)
□ Same dep level + same system + different files → PARALLEL (likely safe)
□ Same dep level + same system + same files → SEQUENTIAL (conflict)
□ Any failure → pause batch immediately, ask user
□ Blocked by failed dependency → skip, report in summary
```

---

## Enforcement

These rules MUST be followed for:
- Any task that would benefit from structured prompt generation
- Any batch execution of pending prompts
- Any execution report generation

**Deviation requires explicit user approval.**

**System prefix MUST match README.md's System Prefix Table (project-rules Rule 9).**
**Naming MUST follow `<prefix>-<type>-<name>.md` format (project-rules Rule 9).**
**All prompts and reports use Markdown format (project-rules Rule 6, already locked).**

---

## Version History

| Version | Build | Changes |
|---------|-------|---------|
| v1.0 | 001 | Initial creation — Rule 1 (Prompt Generator) + Rule 2 (Prompt Executor) |
| v1.0 | 002 | Added trigger phrases to description for reliable skill loading |
| v1.1 | 001 | Added Session System Assignment mechanism + Phase 0: Pre-Execution Validation (system mismatch protection) |
| v1.1 | 002 | Added system filtering to Phase 1 — executor now filters prompts by session's assigned system |
