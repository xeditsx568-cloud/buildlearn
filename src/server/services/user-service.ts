import { db } from "@/server/db";

/** Minimal Clerk user payload fields used for DB sync (MVP). */
export type ClerkUserEmail = {
  id: string;
  email_address: string;
};

export type ClerkUserPayload = {
  id: string;
  primary_email_address_id: string | null;
  email_addresses?: ClerkUserEmail[];
};

export type ClerkUserDeletedPayload = {
  id?: string;
  deleted?: boolean;
};

/** Primary email from a Clerk user webhook payload. */
export function getPrimaryEmail(user: ClerkUserPayload): string | null {
  const { primary_email_address_id: primaryId, email_addresses: addresses } =
    user;

  if (primaryId) {
    const primary = addresses?.find(
      (entry: ClerkUserEmail) => entry.id === primaryId,
    );
    if (primary?.email_address) {
      return primary.email_address;
    }
  }

  return addresses?.[0]?.email_address ?? null;
}

/**
 * Create or restore a Clerk user and ensure an empty profile row exists.
 * Idempotent: safe for duplicate `user.created` deliveries and re-signup after soft-delete.
 */
export async function syncUserCreated(user: ClerkUserPayload): Promise<void> {
  const email = getPrimaryEmail(user);
  if (!email) {
    throw new Error(`Clerk user ${user.id} has no email address`);
  }

  await db.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email,
      },
      update: {
        email,
        deletedAt: null,
      },
    });

    await tx.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  });
}

/**
 * Update email for an existing user. Creates the user if `user.updated` arrives first.
 * Does not restore soft-deleted users — only `user.created` clears `deletedAt`.
 */
export async function syncUserUpdated(user: ClerkUserPayload): Promise<void> {
  const email = getPrimaryEmail(user);
  if (!email) {
    return;
  }

  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, deletedAt: true },
  });

  if (!existing) {
    await syncUserCreated(user);
    return;
  }

  if (existing.deletedAt) {
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: { email },
  });
}

/**
 * Soft-delete a user by setting `deleted_at`. Idempotent for repeated deliveries.
 */
export async function syncUserDeleted(clerkUserId: string): Promise<void> {
  if (!clerkUserId) {
    return;
  }

  await db.user.updateMany({
    where: {
      id: clerkUserId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}
