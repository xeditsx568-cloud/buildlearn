# Prisma–Neon connectivity — local CLI note

**Date:** 2026-08-08  
**Scope:** Environment configuration only (no schema model changes)

---

## Verified

| Check | Result |
| ----- | ------ |
| Node runtime | v20.20.2 (matches `.node-version`) |
| Native PostgreSQL (`pg`) to Neon | Success |
| PostgreSQL version | 18.4 |
| Database | `neondb` |
| Public tables | 0 (empty) |
| `pnpm prisma:generate` | Success |
| `pnpm lint` / `typecheck` / `test` | Success |

Configuration in place:

- **`DATABASE_URL`** — pooled Neon host (`-pooler`) for runtime / Prisma Client
- **`DIRECT_URL`** — direct Neon host for Prisma CLI (`db pull`, `migrate`)
- **`prisma/schema.prisma`** — `directUrl = env("DIRECT_URL")`
- **`prisma:*` scripts** — load `.env.local` via `dotenv-cli`

---

## Known local issue

`pnpm prisma:pull` (Prisma schema-engine introspection) returns **P1001** on this
developer machine despite valid direct connectivity via native `pg` to the same
`DIRECT_URL`.

This is isolated to the **local Prisma schema-engine / network path**, not Neon
availability or credential validity. Neon and the database respond normally to
standard PostgreSQL clients.

---

## Before first migration

Re-test Prisma CLI on the target machine before running `pnpm prisma:migrate` or
applying the initial migration:

```bash
pnpm prisma:pull -- --print
pnpm prisma:migrate
```

If `db pull` succeeds, proceed with migrations. If P1001 persists locally, try
another network, VPN, or CI environment — do **not** assume Neon is down when
native `pg` connects successfully.

---

## References

- [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon)
- [Neon connection errors (P1001)](https://neon.com/docs/connect/connection-errors)
