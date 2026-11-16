# apps/worker

NestJS queue consumers on BullMQ. Same code as `apps/api`, started in worker mode (outbox dispatch,
provisioning, billing runs, imports): a NestJS application context with no HTTP server.

- **Owner:** Showrov (skeleton)
- **Built in:** Phase 0, days 9-10
- **Runs with:** `pnpm dev` from the repo root (or `pnpm --filter @erpplug/worker dev`). Needs
  Redis: `pnpm infra:up`.

## How it fits together

| Piece                                  | Where                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| Environment (validated at start-up)    | `src/config/env.ts`: `REDIS_URL`, `WORKER_CONCURRENCY`, `QUEUE_PREFIX`, `LOG_LEVEL` |
| Redis connection, prefix, job defaults | `src/queues/queue-options.ts` (the API reuses these when it produces jobs)          |
| Platform queue `system`                | `src/queues/system.queue.ts` (names, payload types), `system.processor.ts`          |
| Module wiring                          | `src/worker.module.ts`                                                              |

Job defaults: 3 attempts with exponential backoff (5s, 10s); completed jobs are kept for a day
(max 1,000), failed jobs for 7 days. An error that retrying cannot fix should throw BullMQ's
`UnrecoverableError` so the job fails at once.

On `SIGTERM`/`SIGINT` the worker stops taking new jobs, lets running jobs finish, then exits.

## Adding a queue for a module

1. Queue name = module key (`sales`); job names start with it (`sales.invoice-pdf`) (rule R7).
2. Put the queue name, job names and payload types in the module's `contracts/` folder, so the
   API (producer) and the worker (consumer) share them.
3. Write one `@Processor("<queue>")` class extending `WorkerHost` that switches on `job.name`,
   and register the queue and processor in the worker.
4. Jobs must be safe to run twice (a retry after a crash repeats work). Payloads carry IDs,
   including `tenantId`, never whole records.

## Tests

`pnpm --filter @erpplug/worker test` runs real jobs through Redis database 15 with the
`erpplug-test` prefix, so development queues are untouched. CI starts a Redis service container.
