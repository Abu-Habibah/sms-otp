# Holistic Audit & Refactor Skill - Installation Prompt

Use this prompt to instruct any agent to install and comply with the holistic-audit-refactor skill.

---

## Prompt to Copy

```
You are now being equipped with the **holistic-audit-refactor** skill. This skill contains a 9-phase methodology for comprehensive code audit, bug detection, security hardening, performance optimization, and safe refactoring.

### Prerequisites

This skill depends on:
- **project-rules** — for System Prefix Table (Rule 9), Auto Documentation (Rule 1), Version Bump (Rule 8), Doc Index (Rule 5)
- **prompt-rules** — for generating module-specific audit prompts and executing in dependency order

If either is missing, install them first from the .opencode/skills/ directory.

### Your Task:

1. **READ** the current skill file at:
   `E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/holistic-audit-refactor/SKILL.md`

2. **COPY** the entire content to your project's skill directory:
   `<your-project>/.opencode/skills/holistic-audit-refactor/SKILL.md`
   (Create directories if they don't exist)

3. **VERIFY** the copy:
   ```bash
   head -5 <your-project>/.opencode/skills/holistic-audit-refactor/SKILL.md
   ```

4. **COMPLY** with ALL 9 phases:
   - Phase 0: Pre-Flight Assessment (mandatory — establish baseline before any changes)
   - Phase 1: System Architecture Analysis (no code changes — document only)
   - Phase 2: Bug Detection & Fixing (minimal fixes, no refactoring)
   - Phase 3: Performance Optimization (profile first, apply meaningful gains)
   - Phase 4: Security Hardening (severity-classified fixes)
   - Phase 5: Refactoring (tests first, one change at a time)
   - Phase 6: Cross-Layer Consistency (API contracts, types, naming)
   - Phase 7: Testing & Verification (build, tests, linter, type checker all pass)
   - Phase 8: Documentation & Reporting (per-phase reports + final summary)

### Critical Requirements:

- **NEVER skip Phase 0** — always establish build/test/lint baseline before changes
- **NEVER refactor and fix bugs in the same change** — separate phases
- **NEVER use type suppressions** — no `as any`, `@ts-ignore`, `@ts-expect-error`
- **ALWAYS revert if tests break** — never "patch around" a broken change
- **ALWAYS bump version** after audit completion (per project-rules Rule 8)

### Verification:

```bash
ls <your-project>/.opencode/skills/holistic-audit-refactor/SKILL.md && echo "✅ Skill installed" || echo "❌ Installation failed"
grep -c "^## Phase" <your-project>/.opencode/skills/holistic-audit-refactor/SKILL.md
```

Expected output: `9` (Phases 0-8)

You are now equipped with holistic-audit-refactor skill. Follow all 9 phases for any audit or refactoring task.
```

---

## Agent Compliance Checklist

```
HOLISTIC-AUDIT-REFACTOR — INSTALLATION COMPLETE

□ Skill file copied to: <project>/.opencode/skills/holistic-audit-refactor/SKILL.md
□ Version installed: v1.0 (Build: 001)
□ Phases loaded: 9 (0-8)

Prerequisites verified:
□ project-rules skill installed
□ prompt-rules skill installed
□ System Prefix Table exists in README.md

Phases active:
□ Phase 0: Pre-Flight Assessment
□ Phase 1: Architecture Analysis
□ Phase 2: Bug Fixing
□ Phase 3: Performance Optimization
□ Phase 4: Security Hardening
□ Phase 5: Refactoring
□ Phase 6: Cross-Layer Consistency
□ Phase 7: Testing & Verification
□ Phase 8: Documentation & Reporting

Agent is now COMPLIANT with holistic-audit-refactor v1.0 (Build: 001).
```
