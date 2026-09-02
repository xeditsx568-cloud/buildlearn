import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isProtectedRoute,
  requiresOnboardingResumeRouting,
} from "@/lib/auth-routes";
import {
  createDefaultOnboardingResumeInput,
  getOnboardingRouteGuardRedirect,
  resolveAuthenticatedDestination,
  type OnboardingResumeInput,
} from "@/lib/onboarding/onboarding-resume";

async function fetchOnboardingResumeInput(
  req: NextRequest,
): Promise<OnboardingResumeInput> {
  const profileUrl = new URL("/api/profile", req.url);

  try {
    const response = await fetch(profileUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return createDefaultOnboardingResumeInput();
    }

    return (await response.json()) as OnboardingResumeInput;
  } catch {
    return createDefaultOnboardingResumeInput();
  }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    if (isProtectedRoute(pathname)) {
      await auth.protect();
    }

    return;
  }

  if (!requiresOnboardingResumeRouting(pathname)) {
    return;
  }

  const resumeInput = await fetchOnboardingResumeInput(req);

  if (pathname.startsWith("/sign-")) {
    const destination = resolveAuthenticatedDestination(resumeInput);
    if (pathname !== destination) {
      return NextResponse.redirect(new URL(destination, req.url));
    }

    return;
  }

  const guardRedirect = getOnboardingRouteGuardRedirect(pathname, resumeInput);

  if (guardRedirect && pathname !== guardRedirect) {
    return NextResponse.redirect(new URL(guardRedirect, req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
