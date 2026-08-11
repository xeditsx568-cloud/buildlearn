-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('goal', 'experience', 'quiz', 'path');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "onboarding_step" "OnboardingStep";
