import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

import { AUTHENTICATED_HOME } from "@/lib/auth-routes";

export default function SignInPage() {
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
