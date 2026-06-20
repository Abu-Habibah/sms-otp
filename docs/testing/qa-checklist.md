# Runbook: QA Checklist

A pre-release checklist for any code change touching backend, web, or shared types.

---

## Before opening a PR

- [ ] Code compiles: `pnpm typecheck` passes for backend, web, shared-types
- [ ] Lint clean: `pnpm lint` passes
- [ ] Tests pass: `pnpm test` (or per-package)
- [ ] New code has tests (unit for shared types, integration for backend, component for web)
- [ ] No `any`, no `@ts-ignore`, no `@ts-expect-error` (project convention — see `docs/architecture/build-toolchain.md`)
- [ ] Public APIs have a KDoc explaining the **why**, not the what
- [ ] CHANGELOG updated with the change
- [ ] Relevant docs updated per project-rules Rule 1 (auto-doc)
- [ ] New doc file added to README's "Project Documentation" index (project-rules Rule 5)

## Before merging

- [ ] CI green (all gates above + the build)
- [ ] At least one other person reviewed (if there are ≥2 contributors)
- [ ] No `console.log` left behind (use `Logger` or remove)
- [ ] No commented-out code committed
- [ ] No new files in `src-backup/` (that's the v1.0 baseline, frozen)

## Before tagging a release

- [ ] Run the manual smoke test (see `docs/runbooks/smoke-test.md`)
- [ ] CHANGELOG has a versioned entry (`## [X.Y.Z] - YYYY-MM-DD`)
- [ ] Version bumped in `package.json` of all affected packages
- [ ] Backlog updated — task moved to "Done"
- [ ] README's "Project Documentation" section re-verified — no broken links

---

## Per-sprint DoD checks (Sprint 1+)

Before a sprint can be marked complete:

- [ ] All sprint tasks in `docs/sprints/v2.0/sprint-N-*.md` are checked off
- [ ] Each task's deliverable is verified end-to-end (not just "it compiles")
- [ ] Any new bug discovered during the sprint is filed in `docs/bugs/` (project-rules Rule 3)
- [ ] Sprint retro documented at the bottom of the sprint file

---

## Reporting regressions

If something that worked in a previous version breaks:

1. Open a `docs/bugs/<bug-id>-<title>.md` per project-rules Rule 3
2. Add a one-liner to `docs/bugs/known-issues.md`
3. Reference the bug id from the related feature doc

The project-rules skill is at `E:\Software Dev\GitRepository\opencodeGate\.opencode\skills\project-rules\SKILL.md` if you need to reference it.
