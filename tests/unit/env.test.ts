import * as z from "zod";
import { describe, expect, it } from "vitest";

import { phase1ClientSchema, phase1ServerSchema } from "@/env";

const phase1EnvSchema = z.object({
  ...phase1ServerSchema,
  ...phase1ClientSchema,
});

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/buildlearn",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
} as const;

describe("env schema", () => {
  it("accepts a valid Phase 1 payload", () => {
    expect(phase1EnvSchema.parse(validEnv)).toEqual(validEnv);
  });

  it("rejects missing required variables", () => {
    expect(() =>
      phase1EnvSchema.parse({
        DATABASE_URL: validEnv.DATABASE_URL,
      }),
    ).toThrow();
  });
});
