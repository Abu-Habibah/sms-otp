# Project Rules Skill - Installation Prompt

Use this prompt to instruct any agent to install and comply with the project-rules skill.

---

## Prompt to Copy/Install Project Rules Skill

```
You are now being equipped with the **project-rules** skill. This skill contains 8 mandatory rules for documentation, sprint planning, bug tracking, Docker containerization, and version management.

### Your Task:

1. **READ** the current project-rules skill file at:
   `E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md`

2. **COPY** the entire content to your project's skill directory:
   `<your-project>/.opencode/skills/project-rules/SKILL.md`
   
   (Create directories if they don't exist)

3. **COMPLY** with ALL 9 rules defined in this skill:
   - Rule 1: Auto Documentation Rule
   - Rule 2: Feature/Flow/Capability Implementation Rule
   - Rule 3: Bug Documentation Rule
   - Rule 4: Continuous Documentation Updates
   - Rule 5: Project Documentation Index Rule
   - Rule 6: Documentation Format Consistency Rule
   - Rule 7: Docker Containerization Rule
   - Rule 8: Version Information Display Rule
   - Rule 9: Sprint & Task File Naming Convention (Multi-System Projects)

4. **CONFIRM** installation by listing:
   - File created: `<path>/SKILL.md`
   - Version installed: `v1.1 (Build: 001)`
   - Rules count: 9

### Critical Requirements:

- **NEVER skip documentation** after completing any task
- **ALWAYS update version.json** when completing tasks (use Rule 8 Decision Matrix)
- **ALWAYS offer Docker** when creating projects with multiple systems
- **ALWAYS use shortened container names**: fe, be, pg, rd, mg, etc.
- **ALWAYS follow version format**: `vX.Y (Build: zzz)`

### After Installation:

When you complete ANY task, you MUST:
1. Update relevant documentation (README.md, CHANGELOG.md, docs/*.md)
2. Update version.json (increment build number or version based on task type)
3. Follow the Version Bump Decision Matrix:
   - Bug fix → Build only
   - New feature → Minor + Reset Build
   - Breaking change → Major + Reset Build

### Verification:

Run this command to verify installation:
```bash
cat <your-project>/.opencode/skills/project-rules/SKILL.md | head -5
```

Expected output should show:
```yaml
---
name: project-rules
version: v1.1 (Build: 001)
description: Auto-documentation, sprint planning, and bug tracking rules...
---
```

You are now equipped with project-rules skill. Comply with all 8 rules for every task you complete.
```

---

## Quick Setup Command

For agents that can execute bash, use this one-liner:

```bash
mkdir -p <your-project>/.opencode/skills/project-rules && curl -s "file:///E:/Software%20Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" -o "<your-project>/.opencode/skills/project-rules/SKILL.md" && echo "✅ project-rules skill installed"
```

Or if copying manually:

```bash
# Create directory structure
mkdir -p <your-project>/.opencode/skills/project-rules

# Copy the skill file
cp "E:/Software Dev/GitRepository/opencodeGate/.opencode/skills/project-rules/SKILL.md" "<your-project>/.opencode/skills/project-rules/SKILL.md"

# Verify
cat "<your-project>/.opencode/skills/project-rules/SKILL.md" | head -5
```

---

## Agent Compliance Checklist

After installing, the agent MUST confirm:

```
PROJECT-RULES SKILL - INSTALLATION COMPLETE

□ Skill file copied to: <project>/.opencode/skills/project-rules/SKILL.md
□ Version installed: v1.0 (Build: 003)
□ Rules loaded: 8

Rules enabled:
□ Rule 1: Auto Documentation
□ Rule 2: Feature Implementation
□ Rule 3: Bug Documentation
□ Rule 4: Continuous Updates
□ Rule 5: Documentation Index
□ Rule 6: Format Consistency
□ Rule 7: Docker Containerization
□ Rule 8: Version Display
□ Rule 9: Multi-System Naming Convention

Agent is now COMPLIANT with project-rules skill.
```
