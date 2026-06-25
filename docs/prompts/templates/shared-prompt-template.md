---
system: [prefix from README.md System Prefix Table]
prompt_id: [system]-prompt-[slug]-v[N]
generated_at: [ISO 8601 timestamp — YYYY-MM-DDTHH:MM:SS+TZ]
generated_from: "[verbatim user input that triggered generation]"
status: pending
agent_type: deep | ultrabrain | visual-engineering | quick | general | explore
dependencies: []
related_prompts: []
estimated_effort: [Xh | Xd]
priority: P0 | P1 | P2
tags: []
---

# Prompt: [Task Name]

## System Target
**System:** `[prefix]` — [system description from README.md prefix table]
**Agent Type:** `[agent_type]` — [why this agent type is appropriate for this task]
**Priority:** [P0/P1/P2] — [justification for this priority level]

## Objective
[1-2 sentences: what "done" looks like. Be specific and measurable.]

## Context
[Background information the executing agent needs to understand the task:
- Current project state and relevant history
- Existing patterns, conventions, architectural constraints
- Links to relevant documentation (relative paths to docs/, e.g., docs/features/be-feature-auth.md)
- Any decisions already made that constrain this task
- Dependencies on other systems or prompts]

## Task Description
1. **[Step 1]:** [Concrete action with expected outcome. Be specific about what file to create/modify and what it should contain.]
2. **[Step 2]:** [Concrete action with expected outcome.]
3. **[Step N]:** [Concrete action with expected outcome.]

## Acceptance Criteria
- [ ] [Criterion 1] — verifiable via: [test command / manual check / file assertion]
- [ ] [Criterion 2] — verifiable via: [test command / manual check / file assertion]
- [ ] [Criterion N] — verifiable via: [test command / manual check / file assertion]

> **Quality gate:** Every criterion MUST include a verification method. 
> ❌ BAD: "Login works" 
> ✅ GOOD: "POST /api/auth/login with valid credentials returns 200 + JWT in httpOnly cookie — verify via curl"

## Constraints
- [What the agent MUST NOT do — e.g., "Do NOT modify existing SMS-OTP gateway code"]
- [Files/modules that are OFF-LIMITS — e.g., "Do NOT touch src/be/routes/legacy/"]
- [Patterns to follow with file references — e.g., "Match error response format: see src/be/middleware/error-handler.ts"]
- [Libraries/tools to USE — e.g., "Use zod for validation, bcrypt for hashing"]
- [Libraries/tools to AVOID — e.g., "Do NOT introduce new npm dependencies without explicit approval"]

## Required Files
| File | Action | Purpose |
|------|--------|---------|
| `src/[path]/[file].ts` | CREATE | [what this file does and why it's needed] |
| `src/[path]/[file].ts` | MODIFY | [what changes are needed and why] |
| `docs/[path]/[file].md` | REFERENCE | [what to study from this file before starting] |

> **Action types:** CREATE (new file) | MODIFY (edit existing) | REFERENCE (read-only, for context)

## Expected Deliverables
- [ ] Deliverable 1: `path/to/file` — [success condition — e.g., "File exists, exports authRouter with 4 endpoints"]
- [ ] Deliverable 2: `path/to/file` — [success condition]
- [ ] Deliverable N: `path/to/file` — [success condition]

## Agent Instructions
[Specific guidance for the executing agent:
- Suggested approach or order of operations
- Debugging tips for known tricky areas
- Known pitfalls to avoid
- How to verify work incrementally
- Which project-rules rules apply (e.g., "Remember to follow Rule 1 — auto-document after completion")
- Any special tool/API usage notes]

## Notes
- **Scope boundaries:** [What is explicitly OUT of scope for this prompt]
- **Future work:** [Related tasks planned but not in this prompt — reference other prompt_ids if they exist]
- **Related tickets:** [Links to issues, PRs, or other tracking items]
- **Gotchas:** [Any non-obvious things the agent should watch for]
