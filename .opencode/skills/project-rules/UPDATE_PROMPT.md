# Project Rules Skill - Update Prompt

Use this prompt to instruct any agent to update their project-rules skill to the latest version.

---

## Prompt to Update Project Rules Skill

```
You need to update the project-rules skill to the latest version (v1.1 Build: 001).

### Current Version Check

First, check your current version:
```bash
head -5 <your-project>/.opencode/skills/project-rules/SKILL.md
```

If version is older than v1.1 (Build: 001), proceed with update.

### Update Steps:

1. **BACKUP** your current skill (optional but recommended):
   ```bash
   cp <your-project>/.opencode/skills/project-rules/SKILL.md <your-project>/.opencode/skills/project-rules/SKILL.md.bak
   ```

2. **COPY** the latest version from source:
   ```bash
   cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" "<your-project>/.opencode/skills/project-rules/SKILL.md"
   ```

3. **VERIFY** the update:
   ```bash
   head -5 <your-project>/.opencode/skills/project-rules/SKILL.md
   ```

   Expected output:
   ```yaml
   ---
   name: project-rules
   version: v1.1 (Build: 001)
   description: Auto-documentation, sprint planning, and bug tracking rules...
   ---
   ```

4. **CONFIRM** update by listing:
   - Previous version: [your old version]
   - New version: v1.1 (Build: 001)
   - Rules count: 9 (was 8)

### What's New in v1.1 (Build: 001):

**Rule 9: Sprint & Task File Naming Convention (Multi-System Projects)**

This rule establishes a prefix-based naming convention for projects with multiple systems:

- **Mandatory System Prefix Table** — Must be in README.md
- **Standard Prefixes:** web, web-admin, be, an-{variant}, ios-{variant}, db, ops, shared
- **File Naming Format:** `<prefix>-<type>-<name>.md`
- **Task Cross-Referencing:** Blocks, Blocked By, Related dependencies
- **Directory Structure:** Folders match prefixes

### After Update:

You MUST comply with ALL 9 rules:
- Rule 1: Auto Documentation Rule
- Rule 2: Feature/Flow/Capability Implementation Rule
- Rule 3: Bug Documentation Rule
- Rule 4: Continuous Documentation Updates
- Rule 5: Project Documentation Index Rule
- Rule 6: Documentation Format Consistency Rule
- Rule 7: Docker Containerization Rule
- Rule 8: Version Information Display Rule
- Rule 9: Sprint & Task File Naming Convention (NEW)

### Critical Changes to Implement:

1. **Add System Prefix Table to README.md** (mandatory for multi-system projects):
   ```markdown
   ## System Prefixes

   | System | Prefix | Description | Owner |
   |--------|--------|-------------|-------|
   | [System Name] | `[prefix]` | [Description] | [Owner] |
   | Shared | `shared` | Cross-system features | All Teams |
   ```

2. **Use prefix-based naming** for all new documentation:
   - `web-sprint-1-authentication.md`
   - `be-task-create-api.md`
   - `an-customer-feature-home-screen.md`

3. **Add dependencies** in task files when tasks across systems are related

### Verification:

Run this command to verify all 9 rules are present:
```bash
grep -c "^## Rule" <your-project>/.opencode/skills/project-rules/SKILL.md
```

Expected output: `9`

You are now updated to project-rules v1.1 (Build: 001) with 9 rules.
```

---

## Quick Update Commands

### For Current Project:
```bash
cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" "<your-project>/.opencode/skills/project-rules/SKILL.md"
```

### For Global Installation:
```bash
cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" "~/.config/opencode/skills/project-rules/SKILL.md"
```

### Verify Update:
```bash
head -5 <your-project>/.opencode/skills/project-rules/SKILL.md
```

---

## Agent Update Checklist

After updating, the agent MUST confirm:

```
PROJECT-RULES SKILL - UPDATE COMPLETE

Previous version: [old version]
New version: v1.1 (Build: 001)
Rules count: 9 (was 8)

□ Skill file updated: <path>/SKILL.md
□ Version verified: v1.1 (Build: 001)
□ Rule count verified: 9

New rule added:
□ Rule 9: Sprint & Task File Naming Convention (Multi-System Projects)

Features enabled:
□ System Prefix Table (mandatory in README)
□ Prefix-based file naming (<prefix>-<type>-<name>.md)
□ Task cross-referencing (Blocks/Blocked By/Related)
□ Standard prefixes: web, web-admin, be, an-*, ios-*, db, ops, shared
□ Folder structure matching prefixes

Agent is now COMPLIANT with project-rules v1.1 (Build: 001).
```

---

## Version History Reference

| Version | Build | Changes |
|---------|-------|---------|
| v1.0 | 001 | Initial creation (Rules 1-6) |
| v1.0 | 002 | Added Rule 7: Docker Containerization |
| v1.0 | 003 | Added Rule 8: Version Information Display |
| v1.0 | 004 | Added INSTALL_PROMPT.md |
| v1.0 | 005 | Added related_skills reference |
| v1.1 | 001 | Added Rule 9: Multi-System Naming Convention |
