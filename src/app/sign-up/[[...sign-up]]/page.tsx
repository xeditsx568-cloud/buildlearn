import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { SIGN_UP_REDIRECT } from "@/lib/auth-routes";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="text-lg font-semibold">
        BuildLearn
      </Link>
      <SignUp forceRedirectUrl={SIGN_UP_REDIRECT} />
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-4">
          Return to home
        </Link>
      </p>
    </main>
  );
}
