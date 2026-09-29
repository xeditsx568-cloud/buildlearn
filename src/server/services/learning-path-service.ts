import {
  LearningPathStatus,
  LearningPathStepStatus,
  PathGeneratedBy,
  Prisma,
  type LearningPath,
  type LearningPathStep,
} from "@prisma/client";

import { loadGoalTemplatesFromFile } from "@/lib/content/curriculum";
import { buildDeterministicPathPlan } from "@/lib/learning-path/deterministic-path-plan";
import { getStepPlayerHref } from "@/lib/learning-path/step-navigation";
import { GOAL_MIN_LENGTH } from "@/lib/onboarding/constants";
import { db } from "@/server/db";

export class LearningPathNotFoundError extends Error {
  constructor(message = "Learning path not found") {
    super(message);
    this.name = "LearningPathNotFoundError";
  }
}

export class LearningPathPreconditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningPathPreconditionError";
  }
}

export type LearningPathStepResponse = {
  id: string;
  orderIndex: number;
  stepType: LearningPathStep["stepType"];
  referenceId: string;
  status: LearningPathStep["status"];
  displayTitle: string;
  sectionId: string;
  playerHref: string | null;
};

export type LearningPathResponse = {
  id: string;
  goalDisplayTitle: string;
  goalTemplateId: string | null;
  status: LearningPath["status"];
  generatedBy: LearningPath["generatedBy"];
  steps: LearningPathStepResponse[];
};

type DbClient = typeof db | Prisma.TransactionClient;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function readStepMetadata(step: LearningPathStep): {
  displayTitle: string;
  sectionId: string;
} {
  const metadata = step.metadata as {
    display_title?: string;
    section_id?: string;
  };

  return {
    displayTitle: metadata.display_title ?? step.referenceId,
    sectionId: metadata.section_id ?? "general",
  };
}

function toLearningPathResponse(
  path: LearningPath & { steps: LearningPathStep[] },
): LearningPathResponse {
  const pathMetadata = path.metadata as { goal_display_title?: string };

  const steps = [...path.steps]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((step) => {
      const { displayTitle, sectionId } = readStepMetadata(step);
      return {
        id: step.id,
        orderIndex: step.orderIndex,
        stepType: step.stepType,
        referenceId: step.referenceId,
        status: step.status,
        displayTitle,
        sectionId,
        playerHref:
          step.status === "locked"
            ? null
            : getStepPlayerHref(step.stepType, step.referenceId),
      };
    });

  return {
    id: path.id,
    goalDisplayTitle:
      pathMetadata.goal_display_title ?? path.goalTemplateId ?? "Your learning path",
    goalTemplateId: path.goalTemplateId,
    status: path.status,
    generatedBy: path.generatedBy,
    steps,
  };
}

async function findActivePath(userId: string, client: DbClient = db) {
  return client.learningPath.findFirst({
    where: {
      userId,
      status: LearningPathStatus.active,
    },
    include: {
      steps: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function createActivePathForUser(
  userId: string,
  client: DbClient,
): Promise<LearningPath & { steps: LearningPathStep[] }> {
  const user = await client.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user?.profile) {
    throw new LearningPathPreconditionError("Profile not found");
  }

  const goalText = user.profile.learningGoalText?.trim() ?? "";
  if (goalText.length < GOAL_MIN_LENGTH) {
    throw new LearningPathPreconditionError(
      "learningGoalText is required before generating a path",
    );
  }

  const plan = buildDeterministicPathPlan({
    learningGoalText: goalText,
    experienceLevel: user.profile.experienceLevel,
    goalTemplates: loadGoalTemplatesFromFile(),
  });

  return client.learningPath.create({
    data: {
      userId,
      goalTemplateId: plan.goalTemplateId,
      status: LearningPathStatus.active,
      generatedBy: PathGeneratedBy.system,
      metadata: plan.metadata,
      steps: {
        create: plan.steps.map((step) => ({
          orderIndex: step.orderIndex,
          stepType: step.stepType,
          referenceId: step.referenceId,
          status:
            step.status === "available"
              ? LearningPathStepStatus.available
              : LearningPathStepStatus.locked,
          metadata: {
            display_title: step.displayTitle,
            section_id: step.sectionId,
          },
        })),
      },
    },
    include: { steps: true },
  });
}

export async function getActiveLearningPathForUser(
  userId: string,
): Promise<LearningPathResponse | null> {
  const path = await findActivePath(userId);
  if (!path) {
    return null;
  }

  return toLearningPathResponse(path);
}

export async function ensureActiveLearningPathForUser(
  userId: string,
  client: DbClient = db,
): Promise<LearningPathResponse> {
  const existing = await findActivePath(userId, client);
  if (existing) {
    return toLearningPathResponse(existing);
  }

  const run = async (tx: DbClient) => {
    const lockedExisting = await findActivePath(userId, tx);
    if (lockedExisting) {
      return lockedExisting;
    }

    try {
      return await createActivePathForUser(userId, tx);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const raced = await findActivePath(userId, tx);
        if (raced) {
          return raced;
        }
      }
      throw error;
    }
  };

  const path =
    client === db
      ? await db.$transaction(async (tx) => run(tx))
      : await run(client);

  return toLearningPathResponse(path);
}
