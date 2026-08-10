import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockVerifyWebhook = vi.fn();
const mockHandleClerkWebhookEvent = vi.fn();

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: (...args: unknown[]) => mockVerifyWebhook(...args),
}));

vi.mock("@/server/services/clerk-webhook-handler", () => ({
  handleClerkWebhookEvent: (...args: unknown[]) =>
    mockHandleClerkWebhookEvent(...args),
}));

import { POST } from "@/app/api/webhooks/clerk/route";

const userPayload = {
  id: "user_2abc123",
  primary_email_address_id: "idn_primary",
  email_addresses: [{ id: "idn_primary", email_address: "learner@example.com" }],
};

function createRequest(body = "{}"): NextRequest {
  return new Request("http://localhost:3000/api/webhooks/clerk", {
    method: "POST",
    body,
  }) as NextRequest;
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when webhook signature verification fails", async () => {
    mockVerifyWebhook.mockRejectedValue(new Error("invalid signature"));

    const response = await POST(createRequest());

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Webhook verification failed");
    expect(mockHandleClerkWebhookEvent).not.toHaveBeenCalled();
  });

  it("returns 200 for a valid user.created event", async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: "user.created",
      data: userPayload,
    });
    mockHandleClerkWebhookEvent.mockResolvedValue(undefined);

    const response = await POST(createRequest(JSON.stringify({ type: "user.created" })));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    expect(mockHandleClerkWebhookEvent).toHaveBeenCalledWith({
      type: "user.created",
      data: userPayload,
    });
  });

  it("returns 200 without handling unsupported event types", async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: "session.created",
      data: { id: "sess_123" },
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(mockHandleClerkWebhookEvent).not.toHaveBeenCalled();
  });

  it("returns 500 when sync processing fails", async () => {
    mockVerifyWebhook.mockResolvedValue({
      type: "user.created",
      data: userPayload,
    });
    mockHandleClerkWebhookEvent.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Webhook handler failed");
  });
});
