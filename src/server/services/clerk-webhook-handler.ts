import {
  syncUserCreated,
  syncUserDeleted,
  syncUserUpdated,
  type ClerkUserDeletedPayload,
  type ClerkUserPayload,
} from "@/server/services/user-service";

export type ClerkUserWebhookEvent =
  | { type: "user.created"; data: ClerkUserPayload }
  | { type: "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: ClerkUserDeletedPayload };

export async function handleClerkWebhookEvent(
  event: ClerkUserWebhookEvent,
): Promise<void> {
  switch (event.type) {
    case "user.created":
      await syncUserCreated(event.data);
      return;
    case "user.updated":
      await syncUserUpdated(event.data);
      return;
    case "user.deleted": {
      const clerkUserId = event.data.id;
      if (clerkUserId) {
        await syncUserDeleted(clerkUserId);
      }
      return;
    }
    default:
      return;
  }
}
