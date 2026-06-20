---
name: project-rules
version: v1.1 (Build: 002)
description: Auto-documentation, sprint planning, and bug tracking rules. Use when completing tasks, adding features, fixing bugs, or creating projects.
install_prompt: INSTALL_PROMPT.md
related_skills:
  - prompt-rules
  - ui-ux-pro-max
---

# Project Rules - Comprehensive Documentation and Sprint Management

## Rule 1: Auto Documentation Rule

### Context
Consistent documentation ensures project continuity and knowledge transfer. This rule ensures all work is documented without requiring explicit instruction.

### When Triggered
After completing ANY task (feature, bug fix, refactor, setup, etc.)

### Actions Required
1. Update relevant documentation (README.md, CHANGELOG.md, docs/*.md)
2. Create docs if they don't exist
3. Record: what was done, changes made, current status, next steps
4. **Do NOT ask permission** - always update docs as part of completing a task

### Documentation Template for Task Completion
```markdown
### [Task/Feature Name]
**System:** [prefix] (e.g., web-customer, be, shared)
**Completed:** [Date]
**Type:** [Feature | Bug Fix | Enhancement | Refactor]

**Summary:**
- Brief description of what was done

**Changes:**
- [File 1]: [What was changed]
- [File 2]: [What was changed]

**Impact:**
- [How this affects the system]
- [Any breaking changes]

**Status:** [Complete | In Progress | Blocked]
**Next Steps:** [What should happen next]
**Related Issues:** [Links to issues/tickets]
```

### Behavior
- This rule applies to ALL tasks, without exception
- Documentation happens automatically after task completion
- Update CHANGELOG.md for all significant changes
- Update relevant sprint/backlog documents

---

## Rule 2: Feature/Flow/Capability Implementation Rule

### Context
Every new feature, flow, or capability must be properly planned, documented, and implemented with end-to-end completeness. No partial implementations.

### When Triggered
When user requests: "add feature", "implement", "create flow", "new capability", "add functionality"

### Phase 1: Requirements Analysis
Before writing any code, produce:

#### 1. Feature Definition Document
```markdown
## Feature: [Name]
**System:** [prefix] (e.g., web-customer, be, shared)

### Overview
- **Description:** What the feature does
- **Problem Solved:** Why this feature is needed
- **User Story:** As a [user type], I want [goal] so that [benefit]

### Scope
- **In Scope:** What will be built
- **Out of Scope:** What won't be built (yet)

### Acceptance Criteria
- [ ] Criterion 1 - verifiable with command/test
- [ ] Criterion 2 - verifiable with command/test
- [ ] Criterion 3 - verifiable with command/test

### Dependencies
- [ ] Dependency 1
- [ ] Dependency 2

### Risks
- Risk 1: [description] → Mitigation: [strategy]
```

#### 2. End-to-End Flow Document
```markdown
## E2E Flow: [Feature Name]
**System:** [prefix] (e.g., web-customer, be, shared)

### Flow Diagram (ASCII)
```
[User/External System]
     │
     ▼
[Entry Point - API/UI/Event]
     │
     ▼
[Processing Layer]
     │
     ▼
[Data Layer]
     │
     ▼
[External Integration/Output]
     │
     ▼
[User/External System]
```

### Step-by-Step Execution
1. **Step 1:** [Description]
   - Input: [what enters]
   - Output: [what exits]
   - Validation: [what is checked]

2. **Step 2:** [Description]
   - Input: [what enters]
   - Output: [what exits]
   - Validation: [what is checked]

### Error Handling
| Error Condition | Handling Strategy | Fallback |
|-----------------|-------------------|----------|
| [Error 1] | [Strategy] | [Fallback] |
| [Error 2] | [Strategy] | [Fallback] |

### QA/Test Scenarios
```gherkin
Scenario: [Happy Path]
  Given [precondition]
  When [action]
  Then [expected result]

Scenario: [Error Case 1]
  Given [precondition with error condition]
  When [action that triggers error]
  Then [expected error handling]

Scenario: [Edge Case]
  Given [edge case condition]
  When [action]
  Then [expected graceful handling]
```

---

### Phase 2: Sprint Planning

#### 1. Create Sprint Backlog
```markdown
## Sprint: [Feature Name] Implementation
**System:** [prefix] (e.g., web-customer, be, shared)
**Sprint Duration:** [X days/weeks]
**Goal:** [Specific, Measurable Goal]

### Sprint Backlog

| Item ID | Task | Description | Estimated Time | Priority | Owner |
|---------|------|-------------|----------------|----------|-------|
| F-SP1-T1 | [Task name] | [Description] | [X hours] | P0/P1/P2 | [Dev name] |
| F-SP1-T2 | [Task name] | [Description] | [X hours] | P0/P1/P2 | [Dev name] |

### Definition of Done
- [ ] All code written and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Code deployed to staging
- [ ] Product Owner acceptance

### Daily Standup Tracking
| Day | Completed | In Progress | Blockers |
|-----|-----------|-------------|----------|
| Day 1 | [tasks] | [tasks] | [blockers] |
```

#### 2. E2E Implementation Checklist
```markdown
## E2E Implementation Checklist: [Feature Name]
**System:** [prefix] (e.g., web-customer, be, shared)

### Implementation Tasks

#### Database/Migration
- [ ] Design schema
- [ ] Write migration
- [ ] Test migration rollback

#### Backend/API
- [ ] Create endpoint(s)
- [ ] Add request validation
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Integration tests

#### Frontend/Client
- [ ] Create UI components
- [ ] Add form validation
- [ ] Handle error states
- [ ] Add loading states
- [ ] E2E tests

#### Integration
- [ ] Connect frontend to backend
- [ ] Test with real data
- [ ] Performance testing
- [ ] Security review

#### Documentation
- [ ] Update API docs
- [ ] Update user guide
- [ ] Add runbook entries
- [ ] Update README

### Evidence Required
- [ ] `.tests/e2e/[feature-name].test.ts` - E2E test passing
- [ ] `.sisyphus/evidence/[feature-name]-success.{ext}` - Working implementation
- [ ] `.sisyphus/evidence/[feature-name]-error.{ext}` - Error handling verified
```

---

## Rule 3: Bug Documentation Rule

### Context
Every bug fix must be documented for future reference, knowledge sharing, and regression prevention.

### When Triggered
When user reports bug, or when agent encounters/fixes an error

### Bug Documentation Template
```markdown
## Bug: [ID]-[Short Title]
**System:** [prefix] (e.g., web-customer, be, shared)

### Bug Details
- **Reported Date:** [Date]
- **Reported By:** [Reporter]
- **Severity:** [Critical | High | Medium | Low]
- **Status:** [Open | In Progress | Resolved | Closed]

### Description
**Summary:** Brief description of the bug
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** What should happen
**Actual Behavior:** What actually happens

### Root Cause Analysis
**Category:** [Coding Error | Design Flaw | Configuration | Environment | Third-Party | Other]
**Root Cause:** [Detailed explanation of why the bug occurred]
**Location:** [File path, line number, module]

### Fix Implementation
**Solution:** How the bug was fixed
**Code Changes:**
```diff
// [File: path/to/file]
- [Old line causing bug]
+ [New fixed line]
```

### Verification
**Test Case:**
```markdown
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| [TC-001] | [Steps] | [Expected] | [Pass/Fail] |
```

### Impact Assessment
- **Users Affected:** How many/what percentage
- **Systems Affected:** List of affected systems
- **Data Impact:** Any data loss/corruption risk

### Lessons Learned
**What Went Well:** [Positive takeaways]
**What Could Be Improved:** [Process improvements]
**Prevention:** [How to prevent similar bugs]

### Related Documentation
- [Link to relevant docs]
- [Link to related tickets]
```

---

## Rule 4: Continuous Documentation Updates

### Context
Documentation is a living document. It must be updated continuously as the project evolves.

### After Every Task Completion
1. Update CHANGELOG.md with:
   ```markdown
   ## [Unreleased] - [Date]
   
   ### [Feature|Bug Fix|Refactor]: [Name]
   - Description of change
   - Issue/Ticket reference
   ```

2. Update feature documentation with:
   - Implementation status
   - New/changed behavior
   - Breaking changes

3. Update API documentation if applicable:
   - New endpoints
   - Changed request/response formats
   - Deprecation notices

### Project Documentation Structure
```
project/
├── docs/
│   ├── features/
│   │   ├── [prefix]-feature-[name].md          # Feature spec (e.g., web-feature-login.md)
│   │   └── [prefix]-feature-[name]-e2e.md      # E2E flow docs
│   ├── sprints/
│   │   ├── [prefix]/
│   │   │   └── [prefix]-sprint-[N]-[name].md   # Sprint planning (e.g., web-sprint-1-auth.md)
│   │   └── backlog.md                          # Current backlog
│   ├── tasks/
│   │   └── [prefix]/
│   │       └── [prefix]-task-[name].md         # Task files (e.g., be-task-create-api.md)
│   ├── bugs/
│   │   ├── [prefix]-bug-[title].md             # Bug reports (e.g., web-bug-login-issue.md)
│   │   └── known-issues.md                     # Known issues list
│   ├── architecture/
│   │   ├── [prefix]-architecture.md            # System-specific arch
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   └── integration-points.md
│   └── runbooks/
│       └── [procedure-name].md                 # Operational runbooks
├── CHANGELOG.md                                # Main changelog
├── README.md                                   # Project overview + System Prefix Table
└── PROJECT_PLAN.md                             # Master project plan
```

---

## Quick Reference Cards

### Card 1: Task Completion Checklist
```
COMPLETING TASK - CHECKLIST:
□ Task completed
□ Documentation updated
□ CHANGELOG updated
□ Feature docs updated (if applicable)
□ Sprint backlog updated (if applicable)
□ QA tests added/updated
□ Runbook updated (if applicable)
```

### Card 2: New Feature Checklist
```
NEW FEATURE - CHECKLIST:
□ Feature definition doc created
□ E2E flow documented
□ Sprint backlog created
□ Implementation tasks defined
□ Definition of Done established
□ Code implementation started
□ Unit tests written
□ Integration tests written
□ E2E tests written
□ Documentation updated
□ PO acceptance obtained
□ CHANGELOG updated
```

### Card 3: Bug Fix Checklist
```
BUG FIX - CHECKLIST:
□ Bug documented
□ Root cause identified
□ Fix implemented
□ Fix verified
□ Test case added
□ Regression tests passed
□ Documentation updated
□ CHANGELOG updated
□ Lessons learned recorded
```

### Card 4: Sprint Ceremonies Documentation
```
SPRINT CEREMONIES:

Starting Sprint:
□ Sprint goals documented
□ Backlog prioritized
□ Tasks assigned

Daily:
□ Progress updated in sprint doc
□ Blockers identified and escalated

Ending Sprint:
□ Review: Demo completed
□ Retrospective: Lessons documented
□ Metrics: Velocity calculated
□ Next sprint: Planning initiated
```

### Card 5: Version Display Checklist
```
VERSION DISPLAY - QUICK CHECK:
□ Format: vX.Y (Build: zzz)
□ Location: Footer, Settings, or About section
□ Style: Subtle, muted color (WCAG AA compliant)
□ Source: version.json (single source of truth)
□ Build number: Sequential (001, 002) or commit hash
□ Responsive: Works on all screen sizes
□ Accessible: Screen reader compatible
```

### Card 6: Multi-System Naming Checklist
```
MULTI-SYSTEM NAMING - QUICK CHECK:
□ Prefix table in README.md (mandatory)
□ Every doc starts with system prefix
□ Prefix matches folder name
□ Format: <prefix>-<type>-<name>.md
□ Use hyphens (-) not underscores (_)
□ Shared docs use "shared" prefix
□ Tasks reference dependencies
□ All prefixes lowercase
□ No spaces in filenames

STANDARD PREFIXES:
web          - Customer web app
web-admin    - Admin dashboard
be           - Backend API
an-{variant} - Android apps
ios-{variant} - iOS apps
db           - Database/migrations
ops          - DevOps/CI/CD
shared       - Cross-system
```

---

## Rule 5: Project Documentation Index Rule

### Context
All project documentation must be discoverable from a single authoritative index. The "Project Documentation" section in README.md serves as the master table of contents with clickable links to every document.

### When Triggered
- Project initialization (new project creation)
- Any new documentation file created
- Any documentation file moved/renamed/deleted
- After every task completion that produces documentation

### Actions Required

#### 1. README.md Structure - Mandatory Project Documentation Section
Every project's README.md **MUST** contain this exact structure:

```markdown
# [Project Name]

[Project description - 2-3 sentences explaining what this project does]

---

## Project Documentation

*All project documentation is listed below. Click any link to open the document.*

### 📋 Project Overview
- [README.md](README.md) — This file: project overview and documentation index
- [CHANGELOG.md](CHANGELOG.md) — Version history and release notes
- [PROJECT_PLAN.md](PROJECT_PLAN.md) — Master project plan and roadmap
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines (if exists)

### 🏗 Architecture & Design
- [docs/architecture/system-overview.md](docs/architecture/system-overview.md) — High-level system architecture
- [docs/architecture/data-flow.md](docs/architecture/data-flow.md) — Data flow diagrams and descriptions
- [docs/architecture/integration-points.md](docs/architecture/integration-points.md) — External integrations

### 🏷️ System Prefixes (Mandatory for Multi-System Projects)
| System | Prefix | Description | Owner |
|--------|--------|-------------|-------|
| [System Name] | `[prefix]` | [Description] | [Owner] |
| Shared | `shared` | Cross-system features | All Teams |

### ✨ Features
- [docs/features/[feature-name].md](docs/features/[feature-name].md) — Feature specification
- [docs/features/[feature-name]-e2e.md](docs/features/[feature-name]-e2e.md) — End-to-end flow documentation

### 🐛 Bugs & Issues
- [docs/bugs/known-issues.md](docs/bugs/known-issues.md) — Known issues and workarounds
- [docs/bugs/[bug-id]-[title].md](docs/bugs/[bug-id]-[title].md) — Individual bug reports

### 🏃 Sprints & Planning
- [docs/sprints/backlog.md](docs/sprints/backlog.md) — Current sprint backlog
- [docs/sprints/sprint-[N]-[name].md](docs/sprints/sprint-[N]-[name].md) — Sprint planning documents

### 📖 Runbooks & Operations
- [docs/runbooks/[procedure-name].md](docs/runbooks/[procedure-name].md) — Operational procedures

### 🧪 Testing & Quality
- [docs/testing/test-plan.md](docs/testing/test-plan.md) — Test strategy and plans
- [docs/testing/qa-checklist.md](docs/testing/qa-checklist.md) — QA verification checklist

> **Note:** Only list documents that actually exist. Remove entries for missing files. Keep this section alphabetized within each category.
```

#### 2. Documentation List Auto-Update Rule
**Every time a new documentation file is created, the agent MUST:**

1. **Add an entry** to the appropriate category in the "Project Documentation" section of README.md
2. **Use relative paths** that are clickable in GitHub/GitLab/VS Code
3. **Maintain alphabetical order** within each category
4. **Use consistent formatting**: `- [Title](path/to/file.md) — Brief description`

#### 3. Documentation Removal Rule
**When a documentation file is deleted or deprecated:**
1. Remove its entry from README.md "Project Documentation" section
2. Add a note to CHANGELOG.md: `### Removed: [doc-name] — [reason]`

### Enforcement
- **No documentation file exists without a README.md entry**
- **No README.md entry points to a non-existent file**
- **Agents must verify link validity after every doc change**

---

## Rule 6: Documentation Format Consistency Rule

### Context
Mixed documentation formats (Markdown + HTML) create maintenance burden, inconsistent rendering, and search problems. Projects must standardize on ONE format.

### When Triggered
- Project initialization (new project creation)
- First documentation file creation
- Any attempt to create documentation in a different format

### Format Selection Protocol

#### At Project Start (First Doc Creation)
The agent **MUST** ask the user **once** at project initialization:

```
📄 Documentation Format Selection
This project has no documentation format set. Choose one:

1. **Markdown (.md)** — Recommended. Native Git rendering, diff-friendly, universal tooling
2. **HTML (.html)** — Only if project requires custom styling/CSS not achievable in Markdown

Your choice applies to ALL documentation files forever. Mixing is forbidden.
```

#### Format Lock-In
Once the first documentation file is created, the format is **locked** for the project:

| Locked Format | Allowed Extensions | Forbidden |
|---------------|-------------------|-----------|
| Markdown | `.md`, `.markdown` | `.html`, `.htm`, `.mdx` |
| HTML | `.html`, `.htm` | `.md`, `.markdown`, `.mdx` |

### Actions Required

#### 1. Format Detection & Enforcement
Before creating ANY documentation file:
1. Check if format is already locked (look for existing `.md` or `.html` files in `docs/`, root)
2. If locked → **Use the locked format exclusively**
3. If not locked → **Prompt user per Format Selection Protocol**, then lock

#### 2. Conversion Requirement (If Format Mismatch Detected)
If an agent discovers mixed formats in the project:
1. **STOP** - Do not create new docs
2. **Report** to user: `Found mixed formats: [list files]. Conversion required.`
3. **Propose** conversion plan (convert minority format to majority format)
4. **Wait** for user approval before proceeding

#### 3. Template Compliance
All documentation templates in Rules 1-4 **MUST** use the locked format:
- If Markdown locked → templates use `.md` extension, Markdown syntax
- If HTML locked → templates use `.html` extension, semantic HTML

### Quick Reference Card

```
DOC FORMAT CONSISTENCY - CHECKLIST:
□ Format locked at project start (first doc creation)
□ All new docs use locked format ONLY
□ No .md and .html mixed in same project
□ README.md "Project Documentation" links use correct extension
□ Templates adapted to locked format
□ Mixed format detection → immediate halt + user notification
```

---

## Rule 7: Docker Containerization Rule

### Context
Containerizing the entire development stack ensures consistent environments across all machines, eliminates "works on my machine" issues, and simplifies onboarding for new developers.

### When Triggered
- Project initialization (new project creation)
- When project includes multiple systems (frontend, backend, database, etc.)

### Actions Required

#### 1. Docker Offer (At Project Start)
When creating a new project that includes **any** of the following systems:
- Frontend application
- Backend API/service
- Database (PostgreSQL, MySQL, MongoDB, Redis, etc.)
- Message queues (RabbitMQ, Kafka)
- Cache layers
- Any other server-side component

The agent **MUST** offer Docker setup to the user:

```
🐳 Docker Setup Available
This project will include multiple systems. Would you like to containerize the entire stack with Docker?

1. **Yes, use Docker (Recommended)** — Full containerized development environment
2. **No, local setup** — Run services directly on host machine

Note: Docker setup includes docker-compose.yml with all services configured.
```

#### 2. Directory Structure (Docker Compose Location)
All Docker configuration files **MUST** follow this exact structure:

```
<project's folder>/
├── docker/
│   └── <project's name>/
│       ├── docker-compose.yml          # Main compose file
│       ├── docker-compose.override.yml # Local dev overrides (optional)
│       ├── .env                        # Environment variables
│       ├── .env.example                # Example env file (committed)
│       └── services/                   # Service-specific configs (optional)
│           ├── fe/
│           │   └── Dockerfile
│           ├── be/
│           │   └── Dockerfile
│           └── pg/
│               └── init.sql
└── src/                                # Source code (outside docker/)
    ├── fe/
    ├── be/
    └── ...
```

#### 3. Container Naming Convention (Shortened Names)
All containers **MUST** use shortened names for brevity and clarity:

| System Type | Container Name | Service Name | Port Mapping |
|-------------|---------------|--------------|--------------|
| Frontend | `fe` | `fe` | `3000:3000` |
| Backend API | `be` | `be` | `8000:8000` |
| PostgreSQL | `pg` | `pg` | `5432:5432` |
| MySQL | `my` | `my` | `3306:3306` |
| MongoDB | `mg` | `mg` | `27017:27017` |
| Redis | `rd` | `rd` | `6379:6379` |
| RabbitMQ | `rmq` | `rmq` | `5672:5672` |
| Nginx | `nx` | `nx` | `80:80` |
| Mailhog | `mh` | `mh` | `8025:8025` |
| Kafka | `kf` | `kf` | `9092:9092` |

#### 4. Docker Compose Template
The generated `docker-compose.yml` **MUST** use this structure:

```yaml
# <project's name> - Development Stack
# Location: docker/<project's name>/docker-compose.yml

version: '3.8'

services:
  # Frontend
  fe:
    build:
      context: ../../src/fe
      dockerfile: ../../docker/<project's name>/services/fe/Dockerfile
    container_name: <project's name>_fe
    ports:
      - "3000:3000"
    volumes:
      - ../../src/fe:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://be:8000
    depends_on:
      - be
    networks:
      - app-network

  # Backend API
  be:
    build:
      context: ../../src/be
      dockerfile: ../../docker/<project's name>/services/be/Dockerfile
    container_name: <project's name>_be
    ports:
      - "8000:8000"
    volumes:
      - ../../src/be:/app
    environment:
      - DATABASE_URL=postgresql://postgres:password@pg:5432/<project's name>
      - REDIS_URL=redis://rd:6379
    depends_on:
      - pg
      - rd
    networks:
      - app-network

  # PostgreSQL Database
  pg:
    image: postgres:16-alpine
    container_name: <project's name>_pg
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=<project's name>
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ../../docker/<project's name>/services/pg/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network

  # Redis Cache
  rd:
    image: redis:7-alpine
    container_name: <project's name>_rd
    ports:
      - "6379:6379"
    volumes:
      - rd-data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  pg-data:
  rd-data:
```

#### 5. Service-Specific Configuration
Each service **MUST** have its own directory under `docker/<project's name>/services/<short-name>/`:

```
services/
├── fe/
│   └── Dockerfile
├── be/
│   └── Dockerfile
└── pg/
    └── init.sql
```

### Quick Reference Card

```
DOCKER SETUP - CHECKLIST:
□ Docker offered at project start
□ Directory: docker/<project's name>/docker-compose.yml
□ Container names use shortened format (fe, be, pg, etc.)
□ Container format: <project's name>_<short-name>
□ Service directories: services/<short-name>/
□ .env.example committed (not .env)
□ Named volumes for persistent data
□ Health checks configured for all services
□ Development overrides in docker-compose.override.yml
```

### Container Name Format
```
Format: <project's name>_<short-name>

Examples:
- myapp_fe    (frontend)
- myapp_be    (backend)
- myapp_pg    (postgresql)
- myapp_rd    (redis)
- myapp_mg    (mongodb)
```

### Volume Naming Convention
```
Format: <project's name>_<service>_data

Examples:
- myapp_pg_data
- myapp_rd_data
- myapp_mg_data
```

---

## Rule 8: Version Information Display Rule

### Context
Users should easily identify the current version of the application they are using. Displaying version information prominently in the UI builds trust, aids debugging, and supports troubleshooting.

### When Triggered
- Project initialization (new project creation)
- When implementing frontend/UI components
- After version bumps or releases

### Actions Required

#### 1. Version Format Standard
All applications **MUST** display version information in this exact format:

```
vX.Y (Build: zzz)
```

Where:
- `vX.Y` — Semantic version (Major.Minor)
- `zzz` — Build number (auto-incremented or commit hash)

**Examples:**
```
v1.0 (Build: 001)
v1.2 (Build: 142)
v2.1 (Build: a3f7b2c)
```

#### 2. Version Source of Truth
The version **MUST** be defined in a single source file:

```
<project's folder>/
└── src/
    ├── fe/
    │   ├── version.json          # Version source (committed)
    │   └── ...
    └── be/
        └── ...
```

**version.json format:**
```json
{
  "version": "1.0",
  "build": "001"
}
```

#### 3. UI Placement Guidelines
Version information **MUST** be displayed in a location that is:
- **Easily discoverable** — Users can find it without searching
- **Aesthetically integrated** — Complements the design, not disrupts it
- **Non-intrusive** — Present but not distracting from core functionality

**Recommended Placement (by application type):**

| Application Type | Recommended Location | Style Notes |
|-----------------|---------------------|-------------|
| Web App (SPA) | Footer or Settings page | Subtle, secondary text color |
| Mobile App | Settings → About section | Consistent with platform guidelines |
| Desktop App | Help → About menu | Standard OS pattern |
| Admin Dashboard | Sidebar footer or header | Low-contrast, non-competing |
| Landing Page | Footer | Smaller font, muted color |

#### 4. UI Component Template

**Web Application (Footer):**
```html
<!-- Version display in footer -->
<footer class="app-footer">
  <div class="footer-content">
    <!-- ... other footer content ... -->
    <div class="version-info">
      <span class="version-text">v1.0 (Build: 001)</span>
    </div>
  </div>
</footer>

<style>
.version-info {
  font-size: 0.75rem;
  color: #6b7280; /* Muted gray */
  opacity: 0.7;
}

.version-info:hover {
  opacity: 1;
}
</style>
```

**Mobile Application (Settings Screen):**
```tsx
// React Native / Flutter equivalent
<View style={styles.aboutSection}>
  <Text style={styles.appName}>My App</Text>
  <Text style={styles.versionText}>v1.0 (Build: 001)</Text>
</View>
```

**Desktop Application (About Dialog):**
```
┌─────────────────────────────────────┐
│         About My Application        │
├─────────────────────────────────────┤
│                                     │
│   Version: v1.0 (Build: 001)        │
│   © 2024 Company Name               │
│                                     │
└─────────────────────────────────────┘
```

#### 5. Build Number Management

| Build Number Type | When to Use | Format |
|------------------|-------------|--------|
| Sequential | Stable releases | `001`, `002`, `003` |
| Commit Hash | Development/CI | `a3f7b2c` (7 chars) |
| Timestamp | Nightly builds | `20240115` |

#### 6. Version Bump Decision Matrix (CRITICAL)

The agent **MUST** use this decision matrix to determine which version component to increment:

| Change Type | Version Component | Example | Trigger Words in Task |
|-------------|------------------|---------|----------------------|
| **Bug Fix** | Build only | `v1.0 (Build: 001)` → `v1.0 (Build: 002)` | fix, bug, patch, hotfix, issue, error |
| **Minor Feature** | Minor + Build reset | `v1.0 (Build: 010)` → `v1.1 (Build: 001)` | feature, add, enhance, improvement, capability |
| **Major Change** | Major + Build reset | `v1.1 (Build: 001)` → `v2.0 (Build: 001)` | breaking, refactor, redesign, migration, overhaul |
| **Documentation Only** | Build only | `v1.1 (Build: 005)` → `v1.1 (Build: 006)` | docs, documentation, readme, comment |
| **Config/Setup** | Build only | `v1.1 (Build: 006)` → `v1.1 (Build: 007)` | config, setup, env, docker, deploy |
| **Refactor (non-breaking)** | Minor + Build reset | `v1.1 (Build: 007)` → `v1.2 (Build: 001)` | refactor, restructure, optimize, clean |

#### 7. Automatic Version Detection Rules

When the agent completes a task, it **MUST** analyze the task to determine version bump:

```
VERSION DETECTION ALGORITHM:

1. READ task description and changes made
2. CHECK against Decision Matrix (Rule 6)
3. DETERMINE bump type:
   - If task mentions "fix", "bug", "error" → BUILD ONLY
   - If task mentions "feature", "add", "new" → MINOR + RESET BUILD
   - If task mentions "breaking", "major", "migration" → MAJOR + RESET BUILD
   - If task is docs/config → BUILD ONLY
4. UPDATE version.json accordingly
5. UPDATE CHANGELOG.md with new version entry
```

#### 8. Version Reset Rules

When incrementing Minor or Major version, **ALWAYS** reset build number:

| Bump Type | Old Version | New Version | Build Reset |
|-----------|-------------|-------------|-------------|
| Build only | `v1.0 (Build: 015)` | `v1.0 (Build: 016)` | No |
| Minor | `v1.0 (Build: 015)` | `v1.1 (Build: 001)` | Yes → `001` |
| Major | `v1.5 (Build: 023)` | `v2.0 (Build: 001)` | Yes → `001` |

#### 9. Accessibility Requirements
- Version text **MUST** have sufficient color contrast (WCAG AA minimum)
- Version text **MUST** be readable at default zoom levels
- Version text **MUST** be available to screen readers (use semantic HTML or aria-label)

### Quick Reference Card

```
VERSION DISPLAY - CHECKLIST:
□ Version format: vX.Y (Build: zzz)
□ Single source of truth: version.json
□ Placement: discoverable + aesthetic
□ Style: subtle, muted, non-intrusive
□ Accessible: WCAG AA contrast compliant
□ Responsive: scales properly on all devices
□ Build number: auto-incremented or commit hash
□ Documentation: version history in CHANGELOG.md
□ Version bump: use Decision Matrix (Rule 6)
```

### Quick Version Bump Reference

```
VERSION BUMP QUICK GUIDE:

BUG FIX / PATCH:
  Task: "fix...", "bug...", "error..."
  Action: Increment BUILD ONLY
  Example: v1.0 (Build: 005) → v1.0 (Build: 006)

NEW FEATURE / MINOR:
  Task: "add...", "feature...", "new..."
  Action: Increment MINOR, RESET BUILD to 001
  Example: v1.0 (Build: 010) → v1.1 (Build: 001)

BREAKING CHANGE / MAJOR:
  Task: "breaking...", "migration...", "overhaul..."
  Action: Increment MAJOR, RESET BUILD to 001
  Example: v1.5 (Build: 023) → v2.0 (Build: 001)

DOCS / CONFIG / SETUP:
  Task: "docs...", "config...", "docker..."
  Action: Increment BUILD ONLY
  Example: v2.0 (Build: 001) → v2.0 (Build: 002)
```

### Version Bump Workflow

```
VERSION BUMP PROCEDURE:

1. Analyze task type (use Decision Matrix)
2. Update version.json:
   {
     "version": "1.1",
     "build": "001"
   }

3. Update CHANGELOG.md:
   ## [1.1] - 2024-01-15
   ### Added
   - [Feature description]

4. Commit with message:
   "chore: bump version to v1.1 (Build: 001)"

5. Tag release (if major/minor):
   git tag v1.1
```

### Version Bump Examples

| Task Description | Current Version | New Version | Reason |
|------------------|-----------------|-------------|--------|
| "Fix login button not responding" | `v1.2 (Build: 005)` | `v1.2 (Build: 006)` | Bug fix → build only |
| "Add dark mode toggle" | `v1.2 (Build: 006)` | `v1.3 (Build: 001)` | New feature → minor + reset |
| "Migrate database to PostgreSQL 16" | `v1.3 (Build: 001)` | `v2.0 (Build: 001)` | Breaking change → major + reset |
| "Update README with API docs" | `v2.0 (Build: 001)` | `v2.0 (Build: 002)` | Docs only → build only |
| "Refactor auth module (no API changes)" | `v2.0 (Build: 002)` | `v2.1 (Build: 001)` | Non-breaking refactor → minor + reset |
| "Add Docker compose for dev" | `v2.1 (Build: 001)` | `v2.1 (Build: 002)` | Config/setup → build only |

---

## Rule 9: Sprint & Task File Naming Convention (Multi-System Projects)

### Context
When a project contains multiple systems (web, mobile apps, backend, etc.), documentation files can have overlapping names, causing confusion. This rule establishes a prefix-based naming convention to ensure every documentation file has a unique, identifiable name.

### When Triggered
- Project initialization (new project creation)
- When project includes 2+ systems (frontend, backend, mobile apps, etc.)
- When creating sprints, tasks, features, bugs, or any documentation

### Mandatory System Field

**All documentation templates MUST include a `System:` field** at the top of the document:

```markdown
## [Document Type]: [Name]
**System:** [prefix] (e.g., web-customer, be, shared)
```

This field:
- Identifies which system/session owns the document
- Enables sessions to auto-discover their tasks/sprints
- Must match the prefix in the filename and folder

### Actions Required

#### 1. Mandatory System Prefix Table
Every project's README.md **MUST** contain a System Prefix Table in the Project Documentation section:

```markdown
## System Prefixes

| System | Prefix | Description | Owner |
|--------|--------|-------------|-------|
| Customer Web | `web` | React customer-facing app | Frontend Team |
| Admin Web | `web-admin` | React admin dashboard | Frontend Team |
| Backend API | `be` | Node.js REST API | Backend Team |
| Android Customer | `an-customer` | Android customer app | Mobile Team |
| Android Admin | `an-admin` | Android admin app | Mobile Team |
| iOS Customer | `ios-customer` | iOS customer app | Mobile Team |
| Database | `db` | Migrations, schemas | Backend Team |
| DevOps | `ops` | CI/CD, Docker, deploy | DevOps Team |
| Shared | `shared` | Cross-system features | All Teams |
```

#### 2. Prefix Assignment Rules

**Core Systems (use these standard prefixes):**

| System Type | Prefix | Description |
|-------------|--------|-------------|
| Frontend Web | `web` | Customer-facing web app |
| Admin Web | `web-admin` | Admin dashboard |
| Backend API | `be` | REST/GraphQL API |
| Android App | `an-{variant}` | Android apps (e.g., `an-customer`, `an-admin`) |
| iOS App | `ios-{variant}` | iOS apps (e.g., `ios-customer`, `ios-admin`) |
| Database | `db` | Migrations, schemas, seeds |
| DevOps | `ops` | CI/CD, Docker, deployment |
| Shared | `shared` | Cross-system features |

**Custom Systems (project-specific):**

| System Type | Prefix | Example |
|-------------|--------|---------|
| Flutter App | `flutter-{variant}` | `flutter-customer` |
| React Native | `rn-{variant}` | `rn-customer` |
| Desktop App | `desktop-{variant}` | `desktop-admin` |
| CLI Tool | `cli` | `cli-deploy` |
| Worker/Queue | `worker` | `worker-email` |
| Cron Job | `cron` | `cron-daily-report` |

#### 3. File Naming Format

**Standard Format:**
```
<prefix>-<type>-<name>.md
```

**Examples:**
```
web-sprint-1-authentication.md
be-task-create-auth-api.md
an-customer-feature-home-screen.md
db-sprint-1-schema-setup.md
ops-task-setup-ci-cd.md
shared-feature-user-authentication.md
```

#### 4. Directory Structure

```
project/
├── docs/
│   ├── sprints/
│   │   ├── web/
│   │   │   ├── web-sprint-1-authentication.md
│   │   │   └── web-sprint-2-product-catalog.md
│   │   ├── web-admin/
│   │   │   ├── web-admin-sprint-1-dashboard-setup.md
│   │   │   └── web-admin-sprint-2-user-management.md
│   │   ├── be/
│   │   │   ├── be-sprint-1-api-foundation.md
│   │   │   └── be-sprint-2-payment-integration.md
│   │   ├── an-customer/
│   │   │   └── an-customer-sprint-1-app-shell.md
│   │   ├── an-admin/
│   │   │   └── an-admin-sprint-1-inventory-view.md
│   │   ├── ios-customer/
│   │   │   └── ios-customer-sprint-1-app-shell.md
│   │   ├── db/
│   │   │   └── db-sprint-1-schema-setup.md
│   │   ├── ops/
│   │   │   └── ops-sprint-1-ci-cd-pipeline.md
│   │   └── shared/
│   │       └── shared-sprint-1-mvp-release.md
│   │
│   ├── tasks/
│   │   ├── web/
│   │   │   ├── web-task-add-login-page.md
│   │   │   └── web-task-create-product-grid.md
│   │   ├── be/
│   │   │   ├── be-task-create-auth-api.md
│   │   │   ├── be-task-setup-database.md
│   │   │   └── be-task-integrate-stripe.md
│   │   ├── an-customer/
│   │   │   └── an-customer-task-add-home-screen.md
│   │   ├── db/
│   │   │   └── db-task-create-users-table.md
│   │   ├── ops/
│   │   │   └── ops-task-setup-github-actions.md
│   │   └── shared/
│   │       └── shared-task-setup-auth-flow.md
│   │
│   ├── features/
│   │   ├── web/
│   │   │   └── web-feature-product-catalog.md
│   │   ├── be/
│   │   │   └── be-feature-payment-processing.md
│   │   └── shared/
│   │       └── shared-feature-user-authentication.md
│   │
│   ├── bugs/
│   │   ├── web/
│   │   │   └── web-bug-login-redirect-issue.md
│   │   ├── be/
│   │   │   └── be-bug-timeout-on-large-payload.md
│   │   └── an-customer/
│   │       └── an-customer-bug-crash-on-scroll.md
│   │
│   └── architecture/
│       ├── shared/
│       │   ├── shared-system-overview.md
│       │   └── shared-api-contracts.md
│       ├── web/
│       │   └── web-architecture.md
│       └── be/
│           └── be-architecture.md
```

#### 5. Task Cross-Referencing

Tasks can reference other tasks across systems using dependency syntax:

**In Task File:**
```markdown
## Task: Add Login Page

### Dependencies
- **Blocks:** `an-customer-task-add-home-screen`
- **Blocked By:** `be-task-create-auth-api`
- **Related:** `shared-feature-user-authentication`

### Description
Implement login page that authenticates against backend API.

### Acceptance Criteria
- [ ] Login form with email/password
- [ ] Calls `be-task-create-auth-api` endpoint
- [ ] Stores JWT token
- [ ] Redirects to home page
```

**Dependency Types:**

| Type | Meaning | Example |
|------|---------|---------|
| `Blocks` | This task must complete before referenced task can start | `web-task-add-login` blocks `an-customer-task-add-login` |
| `Blocked By` | This task cannot start until referenced task completes | `an-customer-task-add-login` blocked by `be-task-create-auth-api` |
| `Related` | Tasks are related but not dependent | `web-task-add-login` related to `shared-feature-user-auth` |

#### 6. Filtering Commands

With this naming convention, you can easily filter documentation:

```bash
# List all frontend tasks
ls docs/tasks/web/

# List all backend sprints
ls docs/sprints/be/

# List all Android-related docs
find docs/ -name "an-*"

# List all shared features
ls docs/features/shared/

# Find all database tasks
find docs/ -name "db-task-*"

# List all cross-system work
find docs/ -name "shared-*"
```

### Quick Reference Card

```
MULTI-SYSTEM NAMING - CHECKLIST:
□ Prefix table added to README.md
□ Every doc starts with system prefix
□ Prefix matches folder name
□ Use hyphens (-) not underscores (_)
□ Format: <prefix>-<type>-<name>.md
□ Shared docs use "shared" prefix
□ Tasks reference dependencies (Blocks/Blocked By/Related)
□ All prefixes lowercase
□ No spaces in filenames
```

### Prefix Cheat Sheet

```
STANDARD PREFIXES:
web          - Customer-facing web app
web-admin    - Admin web dashboard
be           - Backend API/Service
an-{variant} - Android apps (an-customer, an-admin)
ios-{variant} - iOS apps (ios-customer, ios-admin)
db           - Database migrations, schemas
ops          - DevOps, CI/CD, deployment
shared       - Cross-system features

CUSTOM PREFIXES (project-specific):
flutter-{variant} - Flutter apps
rn-{variant}      - React Native apps
desktop-{variant} - Desktop apps
cli               - CLI tools
worker            - Background workers/queues
cron              - Scheduled jobs
```

### Naming Examples

| System | Type | Name | Filename |
|--------|------|------|----------|
| Web Frontend | Sprint | Authentication | `web-sprint-1-authentication.md` |
| Backend API | Task | Create Auth API | `be-task-create-auth-api.md` |
| Android Customer | Feature | Home Screen | `an-customer-feature-home-screen.md` |
| Database | Task | Create Users Table | `db-task-create-users-table.md` |
| DevOps | Sprint | CI/CD Pipeline | `ops-sprint-1-ci-cd-pipeline.md` |
| Shared | Bug | Auth Token Expired | `shared-bug-auth-token-expired.md` |

---

## Enforcement

These rules MUST be followed for:
- Any new project creation
- Any new feature/flow/capability addition
- Any bug fix or error resolution
- Any sprint planning or backlog management
- **Any documentation creation or modification**
- **Any Docker setup or containerization**
- **Any UI component with version display**
- **Any multi-system project documentation**

**Deviation requires explicit user approval.**