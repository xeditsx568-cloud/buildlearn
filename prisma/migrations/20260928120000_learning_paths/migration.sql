-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('active', 'completed', 'paused');

-- CreateEnum
CREATE TYPE "PathGeneratedBy" AS ENUM ('system', 'ai');

-- CreateEnum
CREATE TYPE "LearningPathStepType" AS ENUM ('lesson', 'challenge', 'project_milestone', 'mini_project', 'review');

-- CreateEnum
CREATE TYPE "LearningPathStepStatus" AS ENUM ('locked', 'available', 'in_progress', 'completed', 'skipped');

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_template_id" TEXT,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'active',
    "generated_by" "PathGeneratedBy" NOT NULL DEFAULT 'system',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_steps" (
    "id" TEXT NOT NULL,
    "path_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "step_type" "LearningPathStepType" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "status" "LearningPathStepStatus" NOT NULL DEFAULT 'locked',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "learning_path_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_paths_user_id_status_idx" ON "learning_paths"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_steps_path_id_order_index_key" ON "learning_path_steps"("path_id", "order_index");

-- CreateIndex
CREATE INDEX "learning_path_steps_path_id_order_index_idx" ON "learning_path_steps"("path_id", "order_index");

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_goal_template_id_fkey" FOREIGN KEY ("goal_template_id") REFERENCES "goal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
