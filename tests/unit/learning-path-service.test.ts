import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    learningPath: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    $transaction: (callback: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(callback),
  },
}));

vi.mock("@/lib/content/curriculum", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/curriculum")>();
  return {
    ...actual,
    loadGoalTemplatesFromFile: () => [
      {
        id: "portfolio-site",
        name: "Portfolio",
        matchingKeywords: ["portfolio"],
        conceptIds: ["how-web-works", "html-document-structure"],
      },
    ],
  };
});

import { ensureActiveLearningPathForUser } from "@/server/services/learning-path-service";

const activePath = {
  id: "path_1",
  userId: "user_1",
  goalTemplateId: "portfolio-site",
  status: "active",
  generatedBy: "system",
  metadata: { goal_display_title: "My portfolio" },
  createdAt: new Date(),
  steps: [
    {
      id: "step_1",
      pathId: "path_1",
      orderIndex: 0,
      stepType: "lesson",
      referenceId: "how-websites-work",
      status: "available",
      metadata: {
        display_title: "How Websites Work",
        section_id: "foundations",
      },
    },
  ],
};

describe("ensureActiveLearningPathForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) =>
      callback({
        learningPath: {
          findFirst: mockFindFirst,
          create: mockCreate,
        },
        user: {
          findUnique: mockUserFindUnique,
        },
      }),
    );
  });

  it("returns an existing active path without creating another", async () => {
    mockFindFirst.mockResolvedValue(activePath);

    const result = await ensureActiveLearningPathForUser("user_1");

    expect(result.id).toBe("path_1");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a path when none exists", async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockUserFindUnique.mockResolvedValue({
      id: "user_1",
      profile: {
        learningGoalText: "A portfolio site for my work",
        experienceLevel: "beginner",
      },
    });
    mockCreate.mockResolvedValue(activePath);

    const result = await ensureActiveLearningPathForUser("user_1");

    expect(result.id).toBe("path_1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("returns the winner path when concurrent create hits unique constraint", async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activePath);
    mockUserFindUnique.mockResolvedValue({
      id: "user_1",
      profile: {
        learningGoalText: "A portfolio site for my work",
        experienceLevel: "beginner",
      },
    });
    mockCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const result = await ensureActiveLearningPathForUser("user_1");

    expect(result.id).toBe("path_1");
  });
});
