# Migration Plan (Zero-Downtime)

> Goal: Make the repo stable and scalable without breaking your current Replit-driven workflow.

## Phase 1 — Guardrails (this kit)
- Add configs, CI, and hooks (no code moves yet).
- Fix lint/type errors surfaced by CI.
- Ship as `chore/stabilize-repo` PR with small, readable commits.

## Phase 2 — Module Boundaries
- Introduce path alias `@/*` (already in `tsconfig.base.json`). Start moving shared code to `src/shared` gradually.
- Add ESLint boundaries later if desired (`eslint-plugin-boundaries`).

## Phase 3 — Runtime Hardening
- Replace `process.env.X` reads with the `env` helper from `src/lib/env.ts`.
- Add request validation for APIs using Zod schemas.
- Add `logger` for structured logs; send errors to Sentry in prod.

## Phase 4 — Monorepo (Optional, later)
- When you outgrow a single app, introduce a pnpm workspace:
  - `apps/web` (Next.js or Vite SPA)
  - `packages/ui` (shared components)
  - `packages/shared` (types/utils)
  - `packages/config` (eslint/prettier/ts-configs)
- CI can cache and build per package selectively.

## Phase 5 — Releases (Optional)
- Use semantic PR titles or Conventional Commits + `release-please` to automate versioning and changelogs.

---

## Branch Protection (GitHub)
- Settings → Branches → Add rule for `main`:
  - ✔ Require PRs
  - ✔ Require status checks: `Lint`, `Typecheck`, `Test`
  - ✔ Require linear history (optional)
  - ✔ Dismiss stale approvals on new commits
