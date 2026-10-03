import { auth } from "@clerk/nextjs/server";

import {
  parseMentorGraderEventBody,
  readMentorJsonBody,
} from "@/lib/ai/mentor-http";
import {
  jsonResponse,
  mentorErrorResponse,
} from "@/lib/ai/mentor-route-response";
import { processMentorGraderEvent } from "@/server/services/mentor-grader-event-service";

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const raw = await readMentorJsonBody(request);
    const body = parseMentorGraderEventBody(raw);
    const result = await processMentorGraderEvent({ userId, body });
    return jsonResponse(result, 200);
  } catch (error) {
    return mentorErrorResponse(error);
  }
}
