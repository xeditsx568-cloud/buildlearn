import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AUTHENTICATED_HOME } from "@/lib/auth-routes";

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
  it("uses /dashboard as the authenticated home route", () => {
    expect(AUTHENTICATED_HOME).toBe("/dashboard");
  });

  it("passes forceRedirectUrl to SignIn", async () => {
    const SignInPage = (await import("@/app/sign-in/[[...sign-in]]/page"))
      .default;
    const html = renderToStaticMarkup(<SignInPage />);

    expect(html).toContain('data-force-redirect="/dashboard"');
    expect(html).toContain('data-testid="sign-in"');
  });

  it("passes forceRedirectUrl to SignUp", async () => {
    const SignUpPage = (await import("@/app/sign-up/[[...sign-up]]/page"))
      .default;
    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain('data-force-redirect="/dashboard"');
    expect(html).toContain('data-testid="sign-up"');
  });
});
