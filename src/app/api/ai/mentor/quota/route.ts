import { auth } from "@clerk/nextjs/server";

import {
  jsonResponse,
  mentorErrorResponse,
} from "@/lib/ai/mentor-route-response";
import { createMentorQuotaService } from "@/server/services/mentor-quota-service";

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const quota = await createMentorQuotaService().getStatus(userId);
    return jsonResponse(
      {
        remainingThisMonth: quota.remainingThisMonth,
        limitThisMonth: quota.limitThisMonth,
        resetAt: quota.resetAt,
      },
      200,
      {
        "X-Mentor-Quota-Remaining": String(quota.remainingThisMonth),
      },
    );
  } catch (error) {
    return mentorErrorResponse(error);
  }
}
