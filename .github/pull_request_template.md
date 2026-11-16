## What

<!-- One or two sentences. Link the board issue / build-plan checklist item. -->

## BRD / plan reference

<!-- e.g. BRD 9.3, Build plan Phase 0 day 3-4 -->

## Checklist

- [ ] Merged latest `main` into my branch before opening
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass locally
- [ ] Tests added or updated
- [ ] New tables have `tenant_id` + RLS policy and pass the isolation suite (if any)
- [ ] Contract types in `packages/contracts` updated (if an API changed)
- [ ] Adds a Prisma migration? Announced to the other person first (only one open at a time)
- [ ] Touches the other person's paths? They are requested as reviewer
