# UI UX Pro Max Skill - Installation Prompt

Use this prompt to instruct any agent to install the ui-ux-pro-max-skill for OpenCode.

---

## Prompt to Install UI UX Pro Max Skill

```
You are now being equipped with the **ui-ux-pro-max** skill. This skill provides AI-powered design intelligence for building professional UI/UX across multiple platforms.

### Your Task:

1. **CHECK PREREQUISITES**
   ```bash
   python3 --version
   ```
   - If Python is not installed, install it:
     - Windows: `winget install Python.Python.3.12`
     - macOS: `brew install python3`
     - Ubuntu: `sudo apt update && sudo apt install python3`

2. **INSTALL CLI GLOBALLY**
   ```bash
   npm install -g uipro-cli
   ```

3. **INSTALL SKILL FOR OPENCODE**
   ```bash
   uipro init --ai opencode
   ```
   
   Or for global installation (available for all projects):
   ```bash
   uipro init --ai opencode --global
   ```

4. **VERIFY INSTALLATION**
   ```bash
   # Check CLI is installed
   uipro versions
   
   # Check skill files exist
   ls -la .opencode/skills/ui-ux-pro-max/
   ```

5. **CONFIRM** installation by listing:
   - CLI installed: `uipro-cli`
   - Skill directory: `.opencode/skills/ui-ux-pro-max/`
   - Python requirement: Met

### After Installation:

The skill activates automatically when you request UI/UX work. Just chat naturally:

```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website with dark mode
```

### Available Commands:

```bash
# Generate design system
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "beauty spa" --design-system -p "MySpa"

# Domain-specific search
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography

# Stack-specific guidelines
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "form validation" --stack react
```

### Supported Tech Stacks:

- HTML + Tailwind (default)
- React, Next.js, shadcn/ui
- Vue, Nuxt.js, Nuxt UI
- Angular
- Laravel (Blade, Livewire, Inertia.js)
- Svelte, Astro
- SwiftUI (iOS)
- Jetpack Compose (Android)
- React Native, Flutter

You are now equipped with ui-ux-pro-max skill. Use it for all UI/UX design tasks.
```

---

## Quick Setup Commands

### For Current Project Only:
```bash
npm install -g uipro-cli
uipro init --ai opencode
```

### For All Projects (Global):
```bash
npm install -g uipro-cli
uipro init --ai opencode --global
```

### Update to Latest Version:
```bash
uipro update
```

### Uninstall:
```bash
uipro uninstall --ai opencode
```

---

## Agent Compliance Checklist

After installing, the agent MUST confirm:

```
UI-UX-PRO-MAX SKILL - INSTALLATION COMPLETE

□ Python 3.x installed: [version]
□ CLI installed: uipro-cli
□ Skill installed for: opencode
□ Skill directory: .opencode/skills/ui-ux-pro-max/
□ Scripts available: search.py
□ Data files: styles.csv, colors.csv, fonts.csv, etc.

Features enabled:
□ 161 industry-specific reasoning rules
□ 67 UI styles
□ 161 color palettes
□ 57 font pairings
□ Design System Generator
□ 15 tech stack support

Agent is now COMPLIANT with ui-ux-pro-max skill.
```

---

## Usage Examples

### Auto-Activation (Skill Mode):
```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website with dark mode
Make a mobile app UI for e-commerce
Build a fintech banking app with dark theme
```

### Design System Command:
```bash
# Generate design system with ASCII output
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"

# Generate with Markdown output
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "fintech banking" --design-system -f markdown

# Persist design system to files
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist -p "MyApp"
```

### Persist Design System (Master + Overrides):
```bash
# Create master design system
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist -p "MyApp"

# Create page-specific override
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist -p "MyApp" --page "dashboard"
```

This creates:
```
design-system/
├── MASTER.md           # Global Source of Truth
└── pages/
    └── dashboard.md    # Page-specific overrides
```
