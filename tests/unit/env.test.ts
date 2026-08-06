import * as z from "zod";
import { describe, expect, it } from "vitest";

import {
  phase1ClientSchema,
  phase1ServerSchema,
  phase2ClientSchema,
  phase2ServerSchema,
} from "@/env";

const phase1EnvSchema = z.object({
  ...phase1ServerSchema,
  ...phase1ClientSchema,
});

const phase2EnvSchema = z.object({
  ...phase1ServerSchema,
  ...phase1ClientSchema,
  ...phase2ServerSchema,
  ...phase2ClientSchema,
});

const validPhase1Env = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/buildlearn",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
} as const;

const validPhase2Env = {
  ...validPhase1Env,
  CLERK_SECRET_KEY: "sk_test_ci_dummy_key_for_build_only",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_ci_dummy_key_for_build_only",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: "/dashboard",
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: "/dashboard",
} as const;

describe("env schema", () => {
  it("accepts a valid Phase 1 payload", () => {
    expect(phase1EnvSchema.parse(validPhase1Env)).toEqual(validPhase1Env);
  });

  it("rejects missing required Phase 1 variables", () => {
    expect(() =>
      phase1EnvSchema.parse({
        DATABASE_URL: validPhase1Env.DATABASE_URL,
      }),
    ).toThrow();
  });

  it("accepts a valid Phase 2 payload with Clerk keys", () => {
    expect(phase2EnvSchema.parse(validPhase2Env)).toEqual(validPhase2Env);
  });

  it("rejects missing Clerk variables in Phase 2", () => {
    expect(() => phase2EnvSchema.parse(validPhase1Env)).toThrow();
  });
});
