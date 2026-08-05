import { describe, expect, it } from "vitest";

import {
  isAuthRoute,
  isProtectedAppRoute,
  isPublicRoute,
} from "@/lib/auth-routes";

describe("auth route classification", () => {
  describe("isPublicRoute", () => {
    it("allows marketing and auth pages", () => {
      expect(isPublicRoute("/")).toBe(true);
      expect(isPublicRoute("/sign-in")).toBe(true);
      expect(isPublicRoute("/sign-up")).toBe(true);
      expect(isPublicRoute("/sign-in/factor-one")).toBe(true);
      expect(isPublicRoute("/privacy")).toBe(true);
      expect(isPublicRoute("/terms")).toBe(true);
    });

    it("denies protected app routes", () => {
      expect(isPublicRoute("/dashboard")).toBe(false);
      expect(isPublicRoute("/learn")).toBe(false);
      expect(isPublicRoute("/project")).toBe(false);
      expect(isPublicRoute("/build")).toBe(false);
    });
  });

  describe("isProtectedAppRoute", () => {
    it("protects app shell routes and nested paths", () => {
      expect(isProtectedAppRoute("/dashboard")).toBe(true);
      expect(isProtectedAppRoute("/learn")).toBe(true);
      expect(isProtectedAppRoute("/learn/lessons/foo")).toBe(true);
      expect(isProtectedAppRoute("/project")).toBe(true);
      expect(isProtectedAppRoute("/build/recipes/1")).toBe(true);
    });

    it("does not protect public or future onboarding routes", () => {
      expect(isProtectedAppRoute("/")).toBe(false);
      expect(isProtectedAppRoute("/sign-in")).toBe(false);
      expect(isProtectedAppRoute("/onboarding/goal")).toBe(false);
      expect(isProtectedAppRoute("/api/webhooks/clerk")).toBe(false);
    });
  });

  describe("isAuthRoute", () => {
    it("identifies sign-in and sign-up flows", () => {
      expect(isAuthRoute("/sign-in")).toBe(true);
      expect(isAuthRoute("/sign-up")).toBe(true);
      expect(isAuthRoute("/sign-in/factor-one")).toBe(true);
      expect(isAuthRoute("/dashboard")).toBe(false);
    });
  });
});

/**
 * Middleware redirect behavior (unauthenticated → /sign-in) is enforced by
 * Clerk's auth.protect() in src/middleware.ts. Full request integration
 * requires Clerk session fixtures; route classification is covered above.
 */
describe("middleware protection contract", () => {
  it("requires auth for all documented app routes", () => {
    const appRoutes = ["/dashboard", "/learn", "/project", "/build"];

    for (const route of appRoutes) {
      expect(isProtectedAppRoute(route)).toBe(true);
      expect(isPublicRoute(route)).toBe(false);
    }
  });
});
