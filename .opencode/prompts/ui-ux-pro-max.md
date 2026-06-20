# Agent Prompt: Use ui-ux-pro-max Skill

Use this prompt when delegating UI/UX tasks to agents. It directs them to use the
`ui-ux-pro-max` skill installed at `.opencode/skills/ui-ux-pro-max/`.

---

## Prompt Template (copy-paste into `task()` calls or paste to a fresh agent)

```
You are now equipped with the **ui-ux-pro-max** skill installed at
`.opencode/skills/ui-ux-pro-max/`. This skill provides AI-powered design
intelligence (67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines,
25 chart types, 13+ tech stacks, searchable via Python CLI).

### Your task
1. Analyze the user request and extract:
   - Product type (SaaS, e-commerce, dashboard, landing page, mobile app, etc.)
   - Style keywords (minimal, playful, professional, elegant, dark mode, etc.)
   - Industry (healthcare, fintech, gaming, education, etc.)
   - Target stack — prefer `nextjs` or `react` (this project uses Next.js 14
     in `web/` and Jetpack Compose in `app/`); fall back to `html-tailwind`
     if no stack is specified.
2. **Always start with `--design-system`** to get a comprehensive recommendation
   with reasoning:
   ```bash
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<keywords>" \
     --design-system -p "<ProjectName>"
   ```
3. Domain-specific searches when you need targeted guidance:
   ```bash
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain style
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain typography
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain color
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
   ```
4. Stack-specific guidelines:
   ```bash
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack nextjs
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack jetpack-compose
   ```
5. For persistent design systems, use `--persist` to write
   `design-system/MASTER.md` and per-page overrides under `design-system/pages/`:
   ```bash
   python .opencode/skills/ui-ux-pro-max/scripts/search.py "<keywords>" \
     --design-system --persist -p "<ProjectName>"
   ```
6. Apply the recommendations. After implementation, follow
   `.opencode/skills/project-rules/SKILL.md` (the **project-rules** skill) for
   documentation updates, CHANGELOG entry, and version bump.

### Constraints for this project (SMS Monitor)
- **Web (Next.js 14, Tailwind, shadcn/ui primitives):** matches `nextjs` stack.
  Use `cn()` helper from `web/lib/utils.ts`. Components in `web/components/ui/`.
- **Android (Kotlin, Jetpack Compose planned):** matches `jetpack-compose` stack.
  Material 3 if Compose, or use XML resources already in `app/src/main/res/`.
- **Brand colors:** see `web/tailwind.config.ts` for current tokens. Update
  design system if it conflicts.
- **No unsolicited dependencies:** use what's already in `package.json` /
  `app/build.gradle.kts`. Flag any new dependency request to the user first.

### Confirmation checklist (output this when done)
```
UI-UX-PRO-MAX SKILL - TASK COMPLETE

□ Design system generated: [command used]
□ Stack queried: [nextjs | react | jetpack-compose | html-tailwind]
□ Design system persisted: [yes/no, path if yes]
□ Components implemented: [list]
□ Accessibility (WCAG): [AA | AAA | N/A]
□ Responsive: [mobile | tablet | desktop | all]
□ Project-rules docs updated: [CHANGELOG | README | feature doc]
□ Version bump: [build only | minor | major] per Decision Matrix
```

You are now COMPLIANT with the ui-ux-pro-max skill.
```

---

## How to use this template

### Option 1: Pass directly to a delegated agent

```typescript
// In a Sisyphus delegation
task(
  category="visual-engineering",
  load_skills=["ui-ux-pro-max"],   // <- auto-loads the skill
  run_in_background=false,
  prompt="[paste the prompt template above, customized for the task]"
)
```

The `load_skills=["ui-ux-pro-max"]` parameter is the key — it tells the
delegate to inject the skill's instructions into its context. You can combine
it with other skills:

```typescript
load_skills=["ui-ux-pro-max", "project-rules", "git-master"]
```

### Option 2: Quick-fire UI/UX request

Just say one of these in chat — the skill auto-activates based on its
`description` frontmatter:

> "Build a landing page for the SMS Monitor product"
> "Create a dashboard for the multi-tenant admin panel"
> "Design the keyword configuration screen with dark mode"
> "Make the login page more elegant and professional"

### Option 3: Manual design system generation

```bash
# ASCII output
python .opencode/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" \
  --design-system -p "SMS Monitor Admin"

# Markdown output
python .opencode/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" \
  --design-system -f markdown -p "SMS Monitor Admin"

# Persist to design-system/ folder
python .opencode/skills/ui-ux-pro-max/scripts/search.py "fintech dashboard" \
  --design-system --persist -p "SMS Monitor Admin"
```

---

## Files referenced

- `.opencode/skills/ui-ux-pro-max/SKILL.md` — skill body (292 lines)
- `.opencode/skills/ui-ux-pro-max/scripts/search.py` — search CLI
- `.opencode/skills/ui-ux-pro-max/scripts/core.py` — core engine
- `.opencode/skills/ui-ux-pro-max/scripts/design_system.py` — design system generator
- `.opencode/skills/ui-ux-pro-max/data/*.csv` — searchable database
- `.opencode/skills/project-rules/SKILL.md` — companion skill for docs/version
