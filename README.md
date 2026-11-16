# ErpPlug

Modular, multi-tenant, subscription ERP platform. React + NestJS + PostgreSQL + Prisma in one pnpm/Turborepo monorepo.

- Requirements and architecture: [docs/BRD.pdf](docs/BRD.pdf)
- Phases and work split: [docs/build-plan.pdf](docs/build-plan.pdf)
- Rules every contributor (and every Claude session) follows: [CLAUDE.md](CLAUDE.md)
- Architecture decisions: [docs/adr/](docs/adr/)

## Layout

```
apps/        api (NestJS), worker (BullMQ), web (tenant workspace), admin (operator console)
kernel/      tenancy, identity, access, registry, entitlements, billing, audit
modules/     business modules: contacts, products, sales, purchase, inventory, accounting
packages/    ui, contracts, module-kit, sdk
prisma/      composed schema, migrations, RLS policy generator
infra/       docker-compose, Dockerfiles, deploy
docs/        BRD, build plan, ADRs, contract notes
```

## Getting started

Requires Node 24+ (see `.nvmrc`) and pnpm (`corepack enable pnpm`).

```bash
pnpm install
```

Local infrastructure (PostgreSQL, Redis, MinIO, Mailpit) via Docker Compose arrives in Phase 0, days 3-4.
