import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AUTHENTICATED_HOME, SIGN_UP_REDIRECT } from "@/lib/auth-routes";

const mockAuth = vi.fn();
const mockGetOwnProfileOnboarding = vi.fn();
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/server/services/profile-service", () => ({
  getOwnProfileOnboarding: (...args: unknown[]) =>
    mockGetOwnProfileOnboarding(...args),
  ProfileNotFoundError: class ProfileNotFoundError extends Error {
    constructor(message = "Profile not found") {
      super(message);
      this.name = "ProfileNotFoundError";
    }
  },
}));

vi.mock("@clerk/nextjs", () => ({
  SignIn: ({
    forceRedirectUrl,
  }: {
    forceRedirectUrl?: string;
  }) => <div data-testid="sign-in" data-force-redirect={forceRedirectUrl} />,
  SignUp: ({
    forceRedirectUrl,
  }: {
    forceRedirectUrl?: string;
  }) => <div data-testid="sign-up" data-force-redirect={forceRedirectUrl} />,
}));

describe("post-auth redirect configuration", () => {
  it("uses /dashboard as the authenticated home route for sign-in", () => {
    expect(AUTHENTICATED_HOME).toBe("/dashboard");
  });

  it("uses /onboarding/goal as the sign-up redirect target", () => {
    expect(SIGN_UP_REDIRECT).toBe("/onboarding/goal");
  });

  it("aligns Clerk sign-up force redirect env with SIGN_UP_REDIRECT (OPS-PHASE4-001)", () => {
    expect(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL).toBe(
      SIGN_UP_REDIRECT,
    );
    expect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL).toBe(
      AUTHENTICATED_HOME,
    );
  });

  it("passes forceRedirectUrl to SignIn for signed-out users", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;
    const html = renderToStaticMarkup(await SignInPage());

    expect(html).toContain('data-force-redirect="/dashboard"');
    expect(html).toContain('data-testid="sign-in"');
  });

  it("passes onboarding goal redirect to SignUp", async () => {
    const SignUpPage = (await import("@/app/sign-up/[[...sign-up]]/page"))
      .default;
    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain('data-force-redirect="/onboarding/goal"');
    expect(html).toContain('data-testid="sign-up"');
  });
});

describe("sign-in profile-aware routing", () => {
  it("redirects complete users to /dashboard", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockGetOwnProfileOnboarding.mockResolvedValue({
      userId: "user_2abc123",
      learningGoalText: "A portfolio site",
      experienceLevel: "beginner",
      onboardingStep: "path",
      onboardingComplete: true,
    });

    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;

    await expect(SignInPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
  });

  it("redirects incomplete users to stored resume route", async () => {
    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockGetOwnProfileOnboarding.mockResolvedValue({
      userId: "user_2abc123",
      learningGoalText: "A portfolio site",
      experienceLevel: "beginner",
      onboardingStep: "quiz",
      onboardingComplete: false,
    });

    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;

    await expect(SignInPage()).rejects.toThrow("NEXT_REDIRECT:/onboarding/quiz");
  });

  it("redirects missing profiles to goal inference", async () => {
    const { ProfileNotFoundError } = await import(
      "@/server/services/profile-service"
    );

    mockAuth.mockResolvedValue({ userId: "user_2abc123" });
    mockGetOwnProfileOnboarding.mockRejectedValue(new ProfileNotFoundError());

    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;

    await expect(SignInPage()).rejects.toThrow("NEXT_REDIRECT:/onboarding/goal");
  });
});
