-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('started', 'completed');

-- CreateTable
CREATE TABLE "lesson_progress" (
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL,
    "blocks_completed" JSONB NOT NULL DEFAULT '[]',
    "quiz_score" DOUBLE PRECISION,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("user_id","lesson_id")
);

-- CreateIndex
CREATE INDEX "lesson_progress_user_id_idx" ON "lesson_progress"("user_id");

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
