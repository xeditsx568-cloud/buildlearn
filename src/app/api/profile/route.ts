import { auth } from "@clerk/nextjs/server";

import {
  getOwnProfileOnboarding,
  parsePatchProfileOnboardingInput,
  patchOwnProfileOnboarding,
  ProfileNotFoundError,
  ProfileValidationError,
} from "@/server/services/profile-service";

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export async function GET(): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const profile = await getOwnProfileOnboarding(userId);
    return jsonResponse(profile, 200);
  } catch (error) {
    if (error instanceof ProfileNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    throw error;
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const { userId } = await auth();

  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    const input = parsePatchProfileOnboardingInput(payload);
    const profile = await patchOwnProfileOnboarding(userId, input);
    return jsonResponse(profile, 200);
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }

    if (error instanceof ProfileNotFoundError) {
      return jsonResponse({ error: error.message }, 404);
    }

    throw error;
  }
}
