# The Guild: Stabilization Kit

This kit adds guardrails so Replit can't silently wreck your codebase. It's stack-agnostic and safe to drop into most Node/TS or JS projects.

## What's inside
- **Formatting & Linting:** Prettier + Flat ESLint (TypeScript-aware) with strict, sane defaults.
- **Type Safety:** Strict `tsconfig` with incremental adoption (`allowJs: true`).
- **Testing:** Vitest + coverage.
- **Env Safety:** `src/lib/env.ts` with Zod validation.
- **Logging:** Pino (pretty in dev).
- **CI:** GitHub Actions for lint, typecheck, tests.
- **Hooks:** Husky + lint-staged + Conventional Commits.

## Quickstart
1) **Create a branch**: `git checkout -b chore/stabilize-repo`  
2) **Copy this folder's files** into your repo root (keep existing files; only overwrite if you want these defaults).  
3) **Install deps (pnpm recommended):**
   ```bash
   corepack enable
   pnpm add zod pino pino-pretty dotenv
   pnpm add -D typescript @types/node eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-import eslint-plugin-n eslint-plugin-promise eslint-plugin-security eslint-plugin-unicorn vitest @vitest/coverage-v8 tsx husky lint-staged @commitlint/cli @commitlint/config-conventional
   ```
4) **Activate hooks**:
   ```bash
   pnpm pkg set scripts.prepare="husky"
   pnpm dlx husky-init --no-install
   echo "pnpm lint-staged" > .husky/pre-commit
   chmod +x .husky/pre-commit
   ```
5) **Add scripts** to your `package.json` (merge with existing):
   ```json
   {
     "scripts": {
       "typecheck": "tsc -p tsconfig.json --noEmit",
       "lint": "eslint .",
       "format": "prettier . --write",
       "test": "vitest run",
       "validate": "node ./scripts/validate.mjs"
     },
     "lint-staged": "node --import ./lint-staged.config.mjs -e ''"
   }
   ```
   > If you already use `lint-staged`, keep your version; just ensure pre-commit runs it.

6) **Commit & push**. Open a PR. CI will run the same checks your laptop does.

## Replit Guardrails
- **Turn off any auto-refactor or “AI fixes”** that rewrite code on save. Let ESLint/Prettier do formatting only.
- **Never commit directly from Replit’s web UI**. Pull locally or use PRs so CI can catch issues first.
- **Lock your Node version** with `.nvmrc` and your package manager via lockfile.
- **Protect `main`**: require status checks (lint, typecheck, test) to pass before merging.

## Next steps
- Add more env keys to `src/lib/env.ts` as you wire services.
- Add real tests beside your modules: `src/feature/foo.ts` → `test/feature/foo.test.ts`.
- Consider splitting server/client into separate packages when the app grows.
