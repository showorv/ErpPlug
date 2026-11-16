# infra

Local development infrastructure, Dockerfiles and deploy config.

- **Owner:** Showrov
- **Built in:** Phase 0, days 3-4 (Docker Compose); Phase 4 (production Dockerfiles, deploy)

## Local services

Start Docker Desktop, then from the repo root:

```bash
pnpm infra:up      # start in the background
pnpm infra:ps      # show status
pnpm infra:logs    # follow logs
pnpm infra:down    # stop (keeps data)
pnpm infra:reset   # stop and delete all local data
```

| Service        | Image                   | Address                                                                | Login                        |
| -------------- | ----------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| PostgreSQL 16  | `postgres:16.16-alpine` | `localhost:5432`, database `erpplug`                                   | `erpplug` / `erpplug`        |
| Redis          | `redis:8.8.4-alpine`    | `localhost:6379`                                                       | none                         |
| Object storage | `rustfs/rustfs:1.0.6`   | S3 API `localhost:9000`, console http://localhost:9001/rustfs/console/ | `erpplug` / `erpplug-secret` |
| Mailpit        | `axllent/mailpit`       | SMTP `localhost:1025`, web UI `localhost:8025`                         | none                         |

Connection strings for the apps are in [`.env.example`](../.env.example) at the repo root.
These credentials are for local development only.

The app's bucket (`erpplug`) is not created automatically yet; the Files service will create it on
start-up in Phase 1. To create it by hand, log in to the console and add a bucket named `erpplug`.

### Why RustFS instead of MinIO

The build plan names MinIO, but MinIO no longer publishes its free Docker image. RustFS is an
S3-compatible replacement with the same ports and a web console. The app talks to it through the
standard AWS S3 SDK, so swapping to MinIO, AWS S3 or any other S3 service is only a config change.
