/**
 * Validated environment variables for BuildLearn.
 *
 * Import `env` from server code; never import in client components except
 * for `NEXT_PUBLIC_*` keys. Validation runs at build time via next.config.ts
 * and at runtime on first import.
 */
import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/** Phase 1 server variables — exported for schema unit tests. */
export const phase1ServerSchema = {
  DATABASE_URL: z.url(),
} as const;

/** Phase 1 client variables — exported for schema unit tests. */
export const phase1ClientSchema = {
  NEXT_PUBLIC_APP_URL: z.url(),
} as const;

/** Phase 2 server variables — exported for schema unit tests. */
export const phase2ServerSchema = {
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
} as const;

/** MVP-M3 mentor (optional — Wave 0 stubs; not required for build). */
export const mentorServerSchema = {
  OPENAI_API_KEY: z.string().min(1).optional(),
  AI_MENTOR_MODEL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  AI_MENTOR_MONTHLY_LIMIT: z.string().optional(),
  AI_MENTOR_RPM_LIMIT: z.string().optional(),
  MENTOR_REQUIRE_REDIS: z.enum(["true", "false"]).optional(),
} as const;

/** Phase 2 client variables — exported for schema unit tests. */
export const phase2ClientSchema = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().startsWith("/"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().startsWith("/"),
  /** Clerk v7+ — replaces deprecated NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL */
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string().startsWith("/"),
  /** Clerk v7+ — replaces deprecated NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL */
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string().startsWith("/"),
} as const;

export const env = createEnv({
  server: {
    ...phase1ServerSchema,
    ...phase2ServerSchema,
    ...mentorServerSchema,
  },
  client: {
    ...phase1ClientSchema,
    ...phase2ClientSchema,
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_MENTOR_MODEL: process.env.AI_MENTOR_MODEL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    AI_MENTOR_MONTHLY_LIMIT: process.env.AI_MENTOR_MONTHLY_LIMIT,
    AI_MENTOR_RPM_LIMIT: process.env.AI_MENTOR_RPM_LIMIT,
    MENTOR_REQUIRE_REDIS: process.env.MENTOR_REQUIRE_REDIS,
  },
  emptyStringAsUndefined: true,
});
