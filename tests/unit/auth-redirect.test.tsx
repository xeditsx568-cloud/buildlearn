import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AUTHENTICATED_HOME, SIGN_UP_REDIRECT } from "@/lib/auth-routes";

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

  it("passes forceRedirectUrl to SignIn", async () => {
    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;
    const html = renderToStaticMarkup(<SignInPage />);

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
