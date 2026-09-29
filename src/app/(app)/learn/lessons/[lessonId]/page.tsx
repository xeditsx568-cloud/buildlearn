import Link from "next/link";

export default async function LessonPlayerPlaceholderPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Lesson: {lessonId}</h1>
      <p className="text-muted-foreground">
        The full lesson player (editor, preview, and activities) ships in MVP-M2
        (TASK-206 / TASK-207).
      </p>
      <Link href="/roadmap" className="text-primary underline underline-offset-4">
        ← Back to roadmap
      </Link>
    </section>
  );
}
