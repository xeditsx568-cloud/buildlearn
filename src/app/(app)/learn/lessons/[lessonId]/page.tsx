import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonPlayer } from "@/components/lesson-player/lesson-player";
import {
  getLessonWithAccessForUser,
  LessonNotFoundError,
  PathStepLockedError,
} from "@/server/services/lesson-progress-service";

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { lessonId } = await params;

  try {
    const initialData = await getLessonWithAccessForUser(userId, lessonId);

    if (initialData.progress?.status === "completed") {
      redirect("/roadmap");
    }

    return <LessonPlayer initialData={initialData} />;
  } catch (error) {
    if (error instanceof LessonNotFoundError) {
      notFound();
    }

    if (error instanceof PathStepLockedError) {
      return (
        <section className="mx-auto flex max-w-2xl flex-col gap-4">
          <h1 className="text-2xl font-semibold">Lesson locked</h1>
          <p className="text-muted-foreground">
            This lesson is not available on your roadmap yet. Open lessons from
            your roadmap when they are unlocked.
          </p>
          <Link
            href="/roadmap"
            className="text-primary underline underline-offset-4"
          >
            ← Back to roadmap
          </Link>
        </section>
      );
    }

    throw error;
  }
}
