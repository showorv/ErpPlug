# apps/web

React tenant workspace (Vite). Thin shell that will be built from the `GET /api/v1/bootstrap`
payload in Phase 1; each module's screens are lazy-loaded (BRD 8.5).

- **Owner:** Showrov
- **Built in:** Phase 0, days 5-6 (skeleton)
- **Dev URL:** http://localhost:5173 (`pnpm dev` from the repo root starts it with the API)

## Stack

| Piece        | Choice                               | Where                     |
| ------------ | ------------------------------------ | ------------------------- |
| Build / dev  | Vite 8, React 19, TypeScript 6       | `vite.config.ts`          |
| Styling      | Tailwind CSS 4 (`@tailwindcss/vite`) | `src/index.css`           |
| Routing      | React Router 8, data mode            | `src/app/routes.tsx`      |
| Server state | TanStack Query 5                     | `src/app/query-client.ts` |
| Translations | i18next + react-i18next, typed keys  | `src/i18n/`               |
| API calls    | `apiFetch` on same-origin `/api`     | `src/lib/api.ts`          |
| Tests        | Vitest + Testing Library + jsdom     | `src/**/*.test.tsx`       |

## Rules

- **Every user-facing string goes through `t("...")`** with the key in `src/i18n/locales/en.json`.
  Keys are type-checked: a misspelled key fails `pnpm typecheck`. Bangla is added later as `bn.json`.
- Call the API with relative paths (`/api/...`). In development Vite proxies them to
  `http://localhost:3000`, so there is no CORS and the same code works in production.
- React Router 8: import `RouterProvider` from `react-router/dom`, everything else from `react-router`.
  (`react-router-dom` no longer exists.)
- `@/` is an alias for `src/`.
- Shared components (data table, forms, page states) come from `packages/ui` (Phase 0, days 7-8),
  and the API types from `packages/contracts`.
