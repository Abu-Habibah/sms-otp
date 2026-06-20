# Prompt Rules Skill - Installation Prompt

Use this prompt to instruct any agent to install and comply with the prompt-rules skill.

---

## Prompt to Copy/Install Prompt Rules Skill

```
You are now being equipped with the **prompt-rules** skill. This skill contains 2 rules for structured prompt generation and batch execution management.

### Prerequisite: project-rules Skill (REQUIRED)

The prompt-rules skill depends on the **project-rules** skill for:
- System Prefix Table (Rule 9) — all prompt system prefixes MUST match
- Documentation naming convention (Rule 9) — `<prefix>-prompt-<name>-v<N>.md`
- Version bumping (Rule 8) — executor bumps version after prompt completion
- Auto-documentation (Rule 1) — prompts + reports trigger doc updates
- Documentation index (Rule 5) — prompts listed in README.md

**If project-rules is NOT installed, install it first:**
```bash
mkdir -p <your-project>/.opencode/skills/project-rules && cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" "<your-project>/.opencode/skills/project-rules/SKILL.md"
```

### Your Task:

1. **VERIFY** project-rules skill is installed and the System Prefix Table exists in README.md
2. **READ** the current prompt-rules skill file at:
   `E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/prompt-rules/SKILL.md`
3. **COPY** the entire content to your project's skill directory:
   `<your-project>/.opencode/skills/prompt-rules/SKILL.md`
   (Create directories if they don't exist)
4. **CREATE** the prompts directory structure:
   ```
   <your-project>/docs/prompts/
   ├── templates/
   │   └── shared-prompt-template.md    (copy from source)
   ├── generated/                        (empty — populated by generator)
   ├── reports/                          (empty — populated by executor)
   └── INDEX.md                          (copy from source)
   ```
5. **COPY** supporting files:
   - Template: `E:/Software Dev/GitRepository/opencodeGate/docs/prompts/templates/shared-prompt-template.md` → `<your-project>/docs/prompts/templates/shared-prompt-template.md`
   - Index: `E:/Software Dev/GitRepository/opencodeGate/docs/prompts/INDEX.md` → `<your-project>/docs/prompts/INDEX.md`
6. **COMPLY** with ALL 2 rules:
   - Rule 1: Prompt Generator — transforms user input into structured, agent-consumable prompt documents
   - Rule 2: Prompt Executor — discovers ALL pending prompts, resolves dependency order, batch-executes, generates reports

### Critical Requirements:

- **NEVER define your own system prefixes** — use ONLY the System Prefix Table from README.md (project-rules Rule 9)
- **ALWAYS validate system prefix** before assigning to a prompt
- **ALWAYS use naming format**: `<prefix>-prompt-<name>-v<N>.md`
- **ALWAYS execute ALL pending prompts** when user says "execute task" (batch mode)
- **ALWAYS present execution plan** before starting — do NOT auto-execute
- **ALWAYS generate execution reports** after each prompt completes
- **ALWAYS pause on failure** — ask user: continue/skip/abort
- **ALWAYS bump version** after prompt completion (per project-rules Rule 8)

### After Installation:

When user says "generate prompt for X":
1. Analyze intent (system, scope, deps)
2. Validate system prefix against README.md prefix table
3. Fill shared-prompt-template.md completely
4. Save to docs/prompts/generated/<system>/<prompt_id>.md
5. Update INDEX.md and README.md

When user says "execute task" or "execute all tasks":
1. Scan docs/prompts/generated/ for all status=pending prompts
2. Build dependency graph, topologically sort
3. Present execution plan, wait for confirmation
4. Execute in batches (parallel where safe)
5. Generate execution report per prompt
6. Update INDEX.md, README.md, CHANGELOG.md, version.json

### Verification:

Run this command to verify installation:
```bash
ls <your-project>/.opencode/skills/prompt-rules/SKILL.md && echo "✅ prompt-rules skill installed" || echo "❌ Installation failed"
```

Check rule count:
```bash
grep -c "^## Rule" <your-project>/.opencode/skills/prompt-rules/SKILL.md
```

Expected output: `2`

You are now equipped with prompt-rules skill. Comply with all 2 rules for prompt generation and execution.
```

---

## Quick Setup Command

For agents that can execute bash, use this:

```bash
# Install skill
mkdir -p <your-project>/.opencode/skills/prompt-rules && cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/prompt-rules/SKILL.md" "<your-project>/.opencode/skills/prompt-rules/SKILL.md"

# Create prompts directory
mkdir -p <your-project>/docs/prompts/templates
mkdir -p <your-project>/docs/prompts/generated
mkdir -p <your-project>/docs/prompts/reports

# Copy template and index
cp "E:/Software Dev/GitRepository/opencodeGate/docs/prompts/templates/shared-prompt-template.md" "<your-project>/docs/prompts/templates/shared-prompt-template.md"
cp "E:/Software Dev/GitRepository/opencodeGate/docs/prompts/INDEX.md" "<your-project>/docs/prompts/INDEX.md"

echo "✅ prompt-rules skill installed"
```

---

## Agent Compliance Checklist

After installing, the agent MUST confirm:

```
PROMPT-RULES SKILL - INSTALLATION COMPLETE

□ Skill file copied to: <project>/.opencode/skills/prompt-rules/SKILL.md
□ Version installed: v1.0 (Build: 001)
□ Rules loaded: 2

Prerequisites verified:
□ project-rules skill installed
□ System Prefix Table exists in README.md
□ docs/ directory structure exists

Directories created:
□ docs/prompts/templates/
□ docs/prompts/generated/
□ docs/prompts/reports/
□ docs/prompts/INDEX.md

Rules enabled:
□ Rule 1: Prompt Generator
□ Rule 2: Prompt Executor

Agent is now COMPLIANT with prompt-rules v1.0 (Build: 001).
```
