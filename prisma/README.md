# Prisma

Database schema, migrations, and seed scripts.

**Owner:** Programmer 2 only (unless Master reassigns)

```
prisma/
  schema.prisma    # users + profiles (Phase 1); expanded in later phases
  migrations/      # Version-controlled SQL migrations
  seed.ts          # Seed stub (content in Phase 3)
```

`users.id` is **String** (Clerk user ID, e.g. `user_2abc...`), not UUID.

