# Postgres init scripts

Files ending in `.sql` or `.sh` in this folder run once, in name order, the first time the
Postgres container starts with an empty data volume. Other files (like this README) are ignored.

Planned (Uday, Phase 0): create the `migrator` role that owns tables and the `app` role that
does not own them and cannot bypass row-level security (BRD 9.3).

After changing a script here, re-run it with `pnpm infra:reset` (this deletes local data).
