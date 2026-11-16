# apps/api

NestJS host: composes the kernel and every business module into one HTTP API.

- **Owner:** Showrov (skeleton) · Uday (kernel wiring)
- **Built in:** Phase 0, days 3-4

## Run it

From the repo root, with Docker Desktop running:

```bash
pnpm setup:env         # once: creates .env with random local passwords
pnpm infra:up          # Postgres, Redis, object storage, Mailpit
pnpm --filter @erpplug/api dev
```

| URL                                 | What                                    |
| ----------------------------------- | --------------------------------------- |
| http://localhost:3000/api/health    | Liveness check (unversioned)            |
| http://localhost:3000/api/docs      | Swagger UI                              |
| http://localhost:3000/api/docs-json | OpenAPI document (feeds `packages/sdk`) |
| http://localhost:3000/api/v1/...    | Business routes: `/api/v1/{module}/...` |

## What is in the skeleton

| Piece             | Where                                 | Notes                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config validation | `src/config/env.ts`                   | Zod schema; the app will not start with a missing or bad variable, and the error names each one.                                                                                                                                                        |
| Logging           | `src/common/logging/logger.config.ts` | pino via `nestjs-pino`. JSON in production, pretty in development. Every line has a request id; auth headers and cookies are redacted. Tenant and module ids get added in Phase 1.                                                                      |
| Request ids       | same file                             | Reuses a safe incoming `x-request-id`, otherwise generates one, and always returns it in the response header.                                                                                                                                           |
| Error format      | `src/common/errors/`                  | Every error is `{ error: { status, code, message, details?, requestId, path, timestamp } }`. Throw `ApiException(status, code, message, details)` for a specific code; module codes start with the module key. 5xx errors never leak internal messages. |
| HTTP surface      | `src/app.setup.ts`                    | `/api` prefix, URI versioning (default `v1`), CORS from `CORS_ORIGINS`, Swagger. Shared by `main.ts` and the e2e tests.                                                                                                                                 |
| Health            | `src/health/health.controller.ts`     | Liveness only for now. Postgres and Redis readiness checks come once their clients exist.                                                                                                                                                               |

## Scripts

`dev` (watch mode) · `build` · `start` (runs `dist/`) · `lint` · `typecheck` · `test` (Vitest + SWC)

## Notes

- NestJS 12 packages are ESM-only. This app compiles to CommonJS and loads them through Node's
  `require(esm)`, which is what Nest's own project template does. It needs Node 22.12+; the repo pins 24.
- Tests use SWC (via `unplugin-swc`) so decorator metadata works. Test env vars are in `vitest.config.mts`.
