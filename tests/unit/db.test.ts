import { describe, expect, it } from "vitest";

describe("db client", () => {
  it("exports a Prisma client singleton", async () => {
    process.env.DATABASE_URL ??=
      "postgresql://test:test@localhost:5432/buildlearn_test";

    const { db } = await import("@/server/db");

    expect(db).toBeDefined();
    expect(typeof db.$disconnect).toBe("function");
  });
});
