import { describe, expect, it } from "vitest";

import {
  AUTHENTICATED_HOME,
  isOnboardingRoute,
  isProtectedAppRoute,
  isProtectedRoute,
  isPublicRoute,
  SIGN_UP_REDIRECT,
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

    it("denies protected app and onboarding routes", () => {
      expect(isPublicRoute("/dashboard")).toBe(false);
      expect(isPublicRoute("/learn")).toBe(false);
      expect(isPublicRoute("/project")).toBe(false);
      expect(isPublicRoute("/build")).toBe(false);
      expect(isPublicRoute("/onboarding/goal")).toBe(false);
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

    it("does not protect onboarding routes directly", () => {
      expect(isProtectedAppRoute("/onboarding/goal")).toBe(false);
    });
  });

  describe("isOnboardingRoute", () => {
    it("matches onboarding wizard routes", () => {
      expect(isOnboardingRoute("/onboarding/goal")).toBe(true);
      expect(isOnboardingRoute("/onboarding/experience")).toBe(true);
      expect(isOnboardingRoute("/onboarding/quiz")).toBe(true);
      expect(isOnboardingRoute("/onboarding/path")).toBe(true);
    });

    it("does not match unrelated routes", () => {
      expect(isOnboardingRoute("/dashboard")).toBe(false);
      expect(isOnboardingRoute("/roadmap")).toBe(false);
    });
  });

  describe("isProtectedRoute", () => {
    it("requires auth for app and onboarding routes", () => {
      const protectedRoutes = [
        "/dashboard",
        "/learn",
        "/project",
        "/build",
        "/onboarding/goal",
        "/onboarding/experience",
        "/onboarding/quiz",
        "/onboarding/path",
      ];

      for (const route of protectedRoutes) {
        expect(isProtectedRoute(route)).toBe(true);
        expect(isPublicRoute(route)).toBe(false);
      }
    });
  });

  describe("sign-up redirect target", () => {
    it("uses /onboarding/goal for new users after sign-up", () => {
      expect(SIGN_UP_REDIRECT).toBe("/onboarding/goal");
    });

    it("keeps /dashboard as authenticated home for sign-in", () => {
      expect(AUTHENTICATED_HOME).toBe("/dashboard");
    });
  });
});

describe("middleware protection contract", () => {
  it("requires auth for all documented app routes", () => {
    const appRoutes = ["/dashboard", "/learn", "/project", "/build"];

    for (const route of appRoutes) {
      expect(isProtectedRoute(route)).toBe(true);
      expect(isPublicRoute(route)).toBe(false);
    }
  });

  it("requires auth for all onboarding routes", () => {
    const onboardingRoutes = [
      "/onboarding/goal",
      "/onboarding/experience",
      "/onboarding/quiz",
      "/onboarding/path",
    ];

    for (const route of onboardingRoutes) {
      expect(isProtectedRoute(route)).toBe(true);
      expect(isOnboardingRoute(route)).toBe(true);
    }
  });
});
