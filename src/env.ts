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

export const env = createEnv({
  server: phase1ServerSchema,
  client: phase1ClientSchema,
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
