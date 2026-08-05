import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">BuildLearn</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Goal-driven coding education. Coming soon.
      </p>
      <Button asChild>
        <Link href="/dashboard">Get started</Link>
      </Button>
    </main>
  );
}
