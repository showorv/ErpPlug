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
pnpm setup:env   # creates the git-ignored .env with random local passwords
pnpm infra:up    # PostgreSQL, Redis, object storage, Mailpit (needs Docker Desktop)
pnpm dev         # API :3000, tenant workspace :5173, admin console :5174
```

See [infra/README.md](infra/README.md) for the local services.
