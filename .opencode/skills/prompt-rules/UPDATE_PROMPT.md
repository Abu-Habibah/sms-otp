# Prompt Rules Skill - Update Prompt

Use this prompt to instruct any agent to update their prompt-rules skill to the latest version.

---

## Prompt to Update Prompt Rules Skill

```
You need to update the prompt-rules skill to the latest version (v1.0 Build: 001).

### Current Version Check

First, check your current version:
```bash
head -5 <your-project>/.opencode/skills/prompt-rules/SKILL.md
```

If the file does not exist, use the INSTALL_PROMPT.md instead. This update prompt is for existing installations.

### Update Steps:

1. **BACKUP** your current skill (recommended):
   ```bash
   cp <your-project>/.opencode/skills/prompt-rules/SKILL.md <your-project>/.opencode/skills/prompt-rules/SKILL.md.bak
   ```

2. **COPY** the latest version from source:
   ```bash
   cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/prompt-rules/SKILL.md" "<your-project>/.opencode/skills/prompt-rules/SKILL.md"
   ```

3. **UPDATE** supporting files if changed:
   ```bash
   cp "E:/Software Dev/GitRepository/opencodeGate/docs/prompts/templates/shared-prompt-template.md" "<your-project>/docs/prompts/templates/shared-prompt-template.md"
   cp "E:/Software Dev/GitRepository/opencodeGate/docs/prompts/INDEX.md" "<your-project>/docs/prompts/INDEX.md"
   ```

4. **VERIFY** the update:
   ```bash
   head -5 <your-project>/.opencode/skills/prompt-rules/SKILL.md
   ```

   Expected output:
   ```yaml
   ---
   name: prompt-rules
   version: v1.0 (Build: 001)
   description: Prompt generation and execution management...
   ---
   ```

5. **VERIFY** rule count:
   ```bash
   grep -c "^## Rule" <your-project>/.opencode/skills/prompt-rules/SKILL.md
   ```
   Expected output: `2`

6. **CONFIRM** update by listing:
   - Previous version: [your old version]
   - New version: v1.0 (Build: 001)
   - Rules count: 2

### What's Included in v1.0 (Build: 001):

**Rule 1: Prompt Generator**
- Transforms user input ("generate prompt for X") into structured, agent-consumable prompts
- Auto-assigns agent_type based on task complexity
- Validates system prefix against README.md System Prefix Table (project-rules Rule 9)
- Generates prompt_id in `<prefix>-prompt-<slug>-v<N>` format
- Saves to `docs/prompts/generated/<system>/`
- Updates INDEX.md and README.md automatically

**Rule 2: Prompt Executor**
- Discovers ALL pending prompts (scans docs/prompts/generated/)
- Builds dependency graph with topological sort
- Identifies parallel execution batches (different systems, no file conflicts)
- Presents execution plan before running (requires user confirmation)
- Delegates to correct agent_type with full prompt context
- Generates execution reports in `docs/prompts/reports/`
- Bumps version on completion (per project-rules Rule 8)
- Pauses on failure, asks user: continue/skip/abort

**System Prefix Dependency:**
- All system prefixes reference the README.md System Prefix Table
- This skill does NOT define its own prefix table
- `shared` prefix applies to cross-system prompts

### After Update:

You MUST comply with ALL 2 rules:
- Rule 1: Prompt Generator
- Rule 2: Prompt Executor

### Verification:

```bash
# Check rule count
grep -c "^## Rule" <your-project>/.opencode/skills/prompt-rules/SKILL.md
# Expected: 2

# Check frontmatter
head -6 <your-project>/.opencode/skills/prompt-rules/SKILL.md
# Expected: name: prompt-rules, version: v1.0 (Build: 001)

# Check template exists
ls <your-project>/docs/prompts/templates/shared-prompt-template.md && echo "✅ Template OK"

# Check index exists
ls <your-project>/docs/prompts/INDEX.md && echo "✅ Index OK"
```

You are now updated to prompt-rules v1.0 (Build: 001) with 2 rules.
```

---

## Quick Update Commands

### For Current Project:
```bash
cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/prompt-rules/SKILL.md" "<your-project>/.opencode/skills/prompt-rules/SKILL.md" && echo "✅ Updated"
```

### For Global Installation:
```bash
cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/prompt-rules/SKILL.md" "~/.config/opencode/skills/prompt-rules/SKILL.md" && echo "✅ Updated"
```

### Verify Update:
```bash
head -6 <your-project>/.opencode/skills/prompt-rules/SKILL.md
```

---

## Agent Update Checklist

After updating, the agent MUST confirm:

```
PROMPT-RULES SKILL - UPDATE COMPLETE

Previous version: [old version]
New version: v1.0 (Build: 001)
Rules count: 2

□ Skill file updated: <path>/SKILL.md
□ Version verified: v1.0 (Build: 001)
□ Rule count verified: 2
□ Template updated: shared-prompt-template.md
□ Index updated: INDEX.md

Rules active:
□ Rule 1: Prompt Generator
□ Rule 2: Prompt Executor

System prefix dependency: referencing README.md System Prefix Table (project-rules Rule 9)

Agent is now COMPLIANT with prompt-rules v1.0 (Build: 001).
```

---

## Version History Reference

| Version | Build | Changes |
|---------|-------|---------|
| v1.0 | 001 | Initial creation — Rule 1 (Prompt Generator) + Rule 2 (Prompt Executor) |
