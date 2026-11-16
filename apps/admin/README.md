# apps/admin

React platform admin console (Vite) for our own operators: tenants, plans, prices, manual payment
confirmation.

- **Owner:** Showrov
- **Built in:** Phase 0, days 5-6 (skeleton); screens in Phase 1 (tenants) and Phase 2 (billing)
- **Dev URL:** http://localhost:5174 (`pnpm dev` from the repo root starts it with the API)

Same stack and folder layout as [`apps/web`](../web/README.md): Vite 8, React 19, Tailwind 4,
React Router 8, TanStack Query 5, Vitest. Differences:

- **No translation files.** This is an internal English-only tool; the tenant workspace is the
  translated product.
- Sidebar layout instead of a top bar.
- **UI kit** page at `/ui`: the living reference for `packages/ui`, with the data table running
  against a fake server (`src/features/ui-kit/`) that follows the real list conventions.
- Operators will use separate credentials with mandatory MFA (BRD 11.4), handled in Phase 1.
