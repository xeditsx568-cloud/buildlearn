import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserUpsert = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserUpdateMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockProfileUpsert = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    $transaction: (callback: (tx: unknown) => Promise<void>) =>
      mockTransaction(callback),
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      updateMany: (...args: unknown[]) => mockUserUpdateMany(...args),
    },
  },
}));

import type { ClerkUserPayload } from "@/server/services/user-service";
import {
  getPrimaryEmail,
  syncUserCreated,
  syncUserDeleted,
  syncUserUpdated,
} from "@/server/services/user-service";

const clerkUser: ClerkUserPayload = {
  id: "user_2abc123",
  primary_email_address_id: "idn_primary",
  email_addresses: [
    { id: "idn_primary", email_address: "learner@example.com" },
    { id: "idn_secondary", email_address: "other@example.com" },
  ],
};

describe("getPrimaryEmail", () => {
  it("returns the primary email address when configured", () => {
    expect(getPrimaryEmail(clerkUser)).toBe("learner@example.com");
  });

  it("falls back to the first email when primary id is missing", () => {
    expect(
      getPrimaryEmail({
        ...clerkUser,
        primary_email_address_id: null,
      }),
    ).toBe("learner@example.com");
  });

  it("returns null when no email addresses exist", () => {
    expect(
      getPrimaryEmail({
        ...clerkUser,
        email_addresses: [],
      }),
    ).toBeNull();
  });
});

describe("syncUserCreated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) =>
      callback({
        user: { upsert: mockUserUpsert },
        profile: { upsert: mockProfileUpsert },
      }),
    );
  });

  it("upserts user and profile rows", async () => {
    await syncUserCreated(clerkUser);

    expect(mockUserUpsert).toHaveBeenCalledWith({
      where: { id: "user_2abc123" },
      create: {
        id: "user_2abc123",
        email: "learner@example.com",
      },
      update: {
        email: "learner@example.com",
        deletedAt: null,
      },
    });
    expect(mockProfileUpsert).toHaveBeenCalledWith({
      where: { userId: "user_2abc123" },
      create: { userId: "user_2abc123" },
      update: {},
    });
  });

  it("is idempotent for duplicate deliveries", async () => {
    await syncUserCreated(clerkUser);
    await syncUserCreated(clerkUser);

    expect(mockTransaction).toHaveBeenCalledTimes(2);
    expect(mockUserUpsert).toHaveBeenCalledTimes(2);
  });

  it("throws when Clerk user has no email", async () => {
    await expect(
      syncUserCreated({
        ...clerkUser,
        email_addresses: [],
      }),
    ).rejects.toThrow("has no email address");
  });
});

describe("syncUserUpdated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) =>
      callback({
        user: { upsert: mockUserUpsert },
        profile: { upsert: mockProfileUpsert },
      }),
    );
  });

  it("updates email for an active user", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "user_2abc123", deletedAt: null });

    await syncUserUpdated(clerkUser);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user_2abc123" },
      data: { email: "learner@example.com" },
    });
  });

  it("creates the user when updated arrives before created", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await syncUserUpdated(clerkUser);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUserUpsert).toHaveBeenCalled();
  });

  it("ignores updates for soft-deleted users", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "user_2abc123",
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await syncUserUpdated(clerkUser);

    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

describe("syncUserDeleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("soft-deletes an active user", async () => {
    await syncUserDeleted("user_2abc123");

    expect(mockUserUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "user_2abc123",
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
  });

  it("is idempotent when delete is delivered twice", async () => {
    await syncUserDeleted("user_2abc123");
    await syncUserDeleted("user_2abc123");

    expect(mockUserUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("no-ops when clerk user id is missing", async () => {
    await syncUserDeleted("");

    expect(mockUserUpdateMany).not.toHaveBeenCalled();
  });
});
