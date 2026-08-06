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
  },
  client: {
    ...phase1ClientSchema,
    ...phase2ClientSchema,
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
  },
  emptyStringAsUndefined: true,
});
