import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSyncUserCreated = vi.fn();
const mockSyncUserUpdated = vi.fn();
const mockSyncUserDeleted = vi.fn();

vi.mock("@/server/services/user-service", () => ({
  syncUserCreated: (...args: unknown[]) => mockSyncUserCreated(...args),
  syncUserUpdated: (...args: unknown[]) => mockSyncUserUpdated(...args),
  syncUserDeleted: (...args: unknown[]) => mockSyncUserDeleted(...args),
}));

import { handleClerkWebhookEvent } from "@/server/services/clerk-webhook-handler";

const userPayload = {
  id: "user_2abc123",
  primary_email_address_id: "idn_primary",
  email_addresses: [{ id: "idn_primary", email_address: "learner@example.com" }],
};

describe("handleClerkWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes user.created to syncUserCreated", async () => {
    await handleClerkWebhookEvent({
      type: "user.created",
      data: userPayload,
    });

    expect(mockSyncUserCreated).toHaveBeenCalledWith(userPayload);
  });

  it("routes user.updated to syncUserUpdated", async () => {
    await handleClerkWebhookEvent({
      type: "user.updated",
      data: userPayload,
    });

    expect(mockSyncUserUpdated).toHaveBeenCalledWith(userPayload);
  });

  it("routes user.deleted to syncUserDeleted", async () => {
    await handleClerkWebhookEvent({
      type: "user.deleted",
      data: { id: "user_2abc123", deleted: true },
    });

    expect(mockSyncUserDeleted).toHaveBeenCalledWith("user_2abc123");
  });

  it("ignores user.deleted when id is missing", async () => {
    await handleClerkWebhookEvent({
      type: "user.deleted",
      data: { deleted: true },
    });

    expect(mockSyncUserDeleted).not.toHaveBeenCalled();
  });
});
