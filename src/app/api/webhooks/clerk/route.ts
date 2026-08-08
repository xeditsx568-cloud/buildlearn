import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { env } from "@/env";
import { handleClerkWebhookEvent } from "@/server/services/clerk-webhook-handler";

export async function POST(req: NextRequest): Promise<Response> {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;

  try {
    event = await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  try {
    if (
      event.type === "user.created" ||
      event.type === "user.updated" ||
      event.type === "user.deleted"
    ) {
      await handleClerkWebhookEvent(event);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Clerk webhook processing failed:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
