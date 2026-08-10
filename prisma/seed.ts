import { PrismaClient } from "@prisma/client";

import {
  loadCurriculum,
  validateCurriculumIntegrity,
} from "../src/lib/content/curriculum";
import {
  loadLessonFromFile,
  toPersistedLessonContent,
} from "../src/lib/schemas/lesson";

const prisma = new PrismaClient();

export const LESSON_ONE_FILE = "01-how-websites-work.json";

export async function seedCurriculum(client: PrismaClient = prisma): Promise<void> {
  const curriculum = loadCurriculum();
  validateCurriculumIntegrity(curriculum);

  for (const concept of curriculum.concepts) {
    await client.concept.upsert({
      where: { id: concept.id },
      create: {
        id: concept.id,
        name: concept.name,
        description: concept.description,
        domain: concept.domain,
        difficulty: concept.difficulty,
        tags: concept.tags,
      },
      update: {
        name: concept.name,
        description: concept.description,
        domain: concept.domain,
        difficulty: concept.difficulty,
        tags: concept.tags,
      },
    });
  }

  await client.conceptPrerequisite.deleteMany();

  const prerequisiteRows = curriculum.concepts.flatMap((concept) =>
    concept.prerequisites.map((prerequisiteId) => ({
      conceptId: concept.id,
      prerequisiteId,
    })),
  );

  if (prerequisiteRows.length > 0) {
    await client.conceptPrerequisite.createMany({
      data: prerequisiteRows,
      skipDuplicates: true,
    });
  }

  for (const template of curriculum.goalTemplates) {
    await client.goalTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        name: template.name,
        matchingKeywords: template.matchingKeywords,
        conceptIds: template.conceptIds,
      },
      update: {
        name: template.name,
        matchingKeywords: template.matchingKeywords,
        conceptIds: template.conceptIds,
      },
    });
  }
}

export async function seedLessons(client: PrismaClient = prisma): Promise<void> {
  const lesson = loadLessonFromFile(LESSON_ONE_FILE);

  await client.lesson.upsert({
    where: { id: lesson.id },
    create: {
      id: lesson.id,
      title: lesson.title,
      content: toPersistedLessonContent(lesson),
      estimatedMinutes: lesson.estimatedMinutes,
      version: lesson.version,
    },
    update: {
      title: lesson.title,
      content: toPersistedLessonContent(lesson),
      estimatedMinutes: lesson.estimatedMinutes,
      version: lesson.version,
    },
  });
}

async function main() {
  await seedCurriculum();
  await seedLessons();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
