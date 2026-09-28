import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getStepPlayerHref } from "@/lib/learning-path/step-navigation";
import {
  ensureActiveLearningPathForUser,
  getActiveLearningPathForUser,
} from "@/server/services/learning-path-service";
import { getOwnProfileOnboarding } from "@/server/services/profile-service";

export default async function RoadmapPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getOwnProfileOnboarding(userId);

  if (!profile.onboardingComplete) {
    redirect("/onboarding/goal");
  }

  const path =
    (await getActiveLearningPathForUser(userId)) ??
    (await ensureActiveLearningPathForUser(userId));

  const firstAvailable =
    path.steps.find((step) => step.status === "available") ?? path.steps[0];

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your roadmap</h1>
        <p className="text-muted-foreground">{path.goalDisplayTitle}</p>
        <p className="text-sm text-muted-foreground">
          MVP roadmap v1 — full visual journey arrives in TASK-205.
        </p>
      </header>

      <ol className="space-y-3">
        {path.steps.map((step) => {
          const href =
            step.playerHref ??
            (step.orderIndex === 0
              ? getStepPlayerHref(step.stepType, step.referenceId)
              : null);
          const isLocked = step.status === "locked";

          return (
            <li
              key={step.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-input px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {step.orderIndex + 1}. {step.displayTitle}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {step.stepType.replaceAll("_", " ")} · {step.status}
                </p>
              </div>
              {href && !isLocked ? (
                <Link
                  href={href}
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Open
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Locked</span>
              )}
            </li>
          );
        })}
      </ol>

      {firstAvailable?.playerHref ? (
        <Link
          href={firstAvailable.playerHref}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue — {firstAvailable.displayTitle}
        </Link>
      ) : null}
    </section>
  );
}
