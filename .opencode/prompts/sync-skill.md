# Agent Prompt: Compare & Sync Skill Between Projects

Use this prompt to compare and synchronize a skill (SKILL.md) between a source and target project. The agent reads both files, diffs content by section, applies missing/outdated sections from source to target, and preserves the target's customizations.

---

## Parameters (fill before using)

| Parameter | Description | Example |
|-----------|-------------|---------|
| `skill_name` | Name of the skill directory | `project-rules` |
| `source_path` | Absolute path to source project root | `E:\Software Dev\GitRepository\opencodeGate` |
| `target_path` | Absolute path to target project root | `E:\Software Dev\GitRepository\SMS OTP` |

---

## Prompt Template (copy-paste into `task()` calls)

```
You are a skill synchronization agent. Your job is to compare and sync a
SKILL.md between two projects, preserving the target's customizations.

### Parameters

- **skill_name:** {skill_name}
- **source_path:** {source_path}
- **target_path:** {target_path}

### Steps

1. **READ source:**
   ```
   {source_path}\.opencode\skills\{skill_name}\SKILL.md
   ```
   Record: total line count, version from YAML frontmatter (`---` block),
   count of `## ` top-level sections.

2. **READ target:**
   ```
   {target_path}\.opencode\skills\{skill_name}\SKILL.md
   ```
   Record: same metadata.

3. **DIFF all content** — split each file by `## ` headings (top-level
   sections only). For every section, compare:
   - Does it exist in source only? → **missing** in target
   - Does it exist in target only? → **custom** to target (preserve it)
   - Does it exist in both? → compare line-by-line:
     - Identical → **match**
     - Different → **outdated** (target has older content)

4. **APPLY changes:**
   - For **missing** sections (source-only): append the section to target
     at the same relative position as in source.
   - For **outdated** sections (both exist, source is newer): replace the
     target's section content with the source's version. But BEFORE
     overwriting, scan the target section for any lines that contain:
     - `<!-- custom -->` or `<!-- project-specific -->` markers
     - Lines with project-specific names (project name, company name,
       team names, folder paths that differ from source)
     If found, KEEP those lines and splice them into the updated section.
   - For **match** sections: skip (no change needed).
   - For **custom** sections (target-only): skip (preserve target's
     unique content).

5. **UPDATE version** in target's YAML frontmatter if source version is
   newer. Format: `version: vX.Y (Build: ZZZ)`.

6. **REPORT** — output the comparison table (see OUTPUT FORMAT below).

### CRITICAL RULES

- **NEVER delete target-only sections.** Target may have project-specific
  rules, examples, or constraints that don't exist in source.
- **NEVER overwrite sections that are identical.** Only update what changed.
- **ALWAYS preserve YAML frontmatter** unless the `version` field changed.
  The `name` and `description` fields may have been customized for the
  target project.
- **ALWAYS read both files BEFORE making any edits.** Do not assume the
  target matches the source.
- **If source and target are identical (SHA256 match):** report "already
  in sync" and exit — do not touch the file.

### OUTPUT FORMAT

After diffing, output this table:

| Section | Source Lines | Target Lines | Status | Action |
|---------|-------------|-------------|--------|--------|
| [heading] | [N] | [N] | match / outdated / missing / custom | [what was done or "skipped (custom)"] |

Example:
| Section | Source Lines | Target Lines | Status | Action |
|---------|-------------|-------------|--------|--------|
| Rule 1: Auto Documentation | 44 | 44 | match | skipped (identical) |
| Rule 7: Docker Containerization | 150 | 120 | outdated | updated — target had custom path example, preserved |
| Rule 9: Multi-System Naming | 262 | 0 | missing | appended from source |
| Custom: Project-Specific Notes | 0 | 15 | custom | preserved (target-only) |

Then output a summary:
- **Total sections compared:** [N]
- **Matched:** [N]
- **Updated:** [N]
- **Added:** [N]
- **Preserved (custom):** [N]
- **Source version:** [version]
- **Target version (after sync):** [version]
```

---

## How to use this prompt

### Option 1: Pass to a delegated agent (recommended for large diffs)

```typescript
task(
  category="unspecified-high",
  load_skills=["project-rules"],  // needs the skill being synced
  run_in_background=false,
  description="Sync project-rules skill",
  prompt=`
    [paste the full prompt template above, with parameters filled in]
  `
)
```

### Option 2: Quick sync (small or known-safe skills)

Just paste the prompt into a fresh conversation and fill the parameters:

```
Compare and sync the `project-rules` skill:
- source: E:\Software Dev\GitRepository\opencodeGate
- target: E:\Software Dev\GitRepository\SMS OTP
```

### Option 3: Batch sync (multiple skills)

```typescript
// Fire parallel sync tasks for multiple skills
["project-rules", "ui-ux-pro-max", "github-triage"].forEach(skill => {
  task(
    category="unspecified-high",
    load_skills=["project-rules"],
    run_in_background=true,  // parallel
    description=`Sync ${skill} skill`,
    prompt=`
      [prompt template with skill_name=${skill}]
    `
  )
})
```

---

## Customization markers

When editing target SKILL.md files, mark project-specific content with
HTML comments so future sync runs can detect and preserve them:

```markdown
## Rule 7: Docker Containerization

### Context
Standard Docker rules apply.

<!-- custom: SMS Monitor uses docker-compose.yml at project root -->
The docker-compose.yml is at the project root (not docker/<name>/).
<!-- end custom -->

### When Triggered
...
```

Rules:
- `<!-- custom: [reason] -->` ... `<!-- end custom -->` — block to preserve
- `<!-- project-specific -->` — single line to preserve
- Anything between these markers is **never overwritten** during sync

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Agent says "SKILL.md not found" | Verify `.opencode/skills/<name>/SKILL.md` exists in both projects |
| Agent reports "0 sections compared" | Both files may be empty or corrupted — re-read with full content |
| Agent overwrites custom content | Re-run with the prompt's "CRITICAL RULES" section emphasized |
| YAML frontmatter differs in structure | Agent preserves target frontmatter unless version differs — this is by design |

---

## Files referenced

- `.opencode/skills/<skill-name>/SKILL.md` — the skill to sync
- `.opencode/prompts/sync-skill.md` — this prompt template
