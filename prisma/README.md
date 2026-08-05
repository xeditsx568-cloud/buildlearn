# Prisma

Database schema, migrations, and seed scripts.

**Owner:** Programmer 2 only (unless Master reassigns)

```
prisma/
  schema.prisma    # Single source of truth for DB schema
  migrations/      # Generated migrations
  seed.ts          # Seed concepts, lessons, templates
```

`users.id` is a **String** matching Clerk user IDs (e.g. `user_2abc...`), not UUID.
