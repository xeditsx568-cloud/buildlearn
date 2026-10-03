/** Lesson step identity for mentor UI race protection (client presentation only). */
export type MentorBlockScope = {
  lessonId: string;
  blockIndex: number;
};

export function isSameMentorBlockScope(
  request: MentorBlockScope,
  active: MentorBlockScope,
): boolean {
  return (
    request.lessonId === active.lessonId &&
    request.blockIndex === active.blockIndex
  );
}
