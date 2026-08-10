import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  AUTHENTICATED_HOME,
  isAuthRoute,
  isProtectedRoute,
} from "@/lib/auth-routes";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId } = await auth();

  if (isAuthRoute(pathname) && userId) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, req.url));
  }

  if (isProtectedRoute(pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
