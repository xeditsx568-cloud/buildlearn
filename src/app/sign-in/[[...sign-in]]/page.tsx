import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTHENTICATED_HOME } from "@/lib/auth-routes";
import {
  createDefaultOnboardingResumeInput,
  resolveAuthenticatedDestination,
} from "@/lib/onboarding/onboarding-resume";
import {
  getOwnProfileOnboarding,
  ProfileNotFoundError,
} from "@/server/services/profile-service";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    try {
      const profile = await getOwnProfileOnboarding(userId);
      redirect(resolveAuthenticatedDestination(profile));
    } catch (error) {
      if (error instanceof ProfileNotFoundError) {
        redirect(
          resolveAuthenticatedDestination(createDefaultOnboardingResumeInput()),
        );
      }

      throw error;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="text-lg font-semibold">
        BuildLearn
      </Link>
      <SignIn forceRedirectUrl={AUTHENTICATED_HOME} />
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Return to home
        </Link>
      </p>
    </main>
  );
}
