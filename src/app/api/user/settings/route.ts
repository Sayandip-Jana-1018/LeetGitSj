/**
 * PATCH /api/user/settings
 *
 * Updates user notification preferences and badge visibility.
 * discordWebhookUrl is encrypted at rest before storage.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    notifyEmail?: string | null;
    discordWebhookUrl?: string | null;
    isPublicBadgeEnabled?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if ("notifyEmail" in body) {
    updateData.notifyEmail = body.notifyEmail?.trim() || null;
  }

  if ("discordWebhookUrl" in body) {
    const raw = body.discordWebhookUrl?.trim();
    if (raw && !raw.startsWith("https://discord.com/api/webhooks/")) {
      return NextResponse.json(
        { error: "Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/" },
        { status: 400 }
      );
    }
    // Encrypt before storage — never stored in plain text
    updateData.discordWebhookUrl = raw ? encrypt(raw) : null;
  }

  if ("isPublicBadgeEnabled" in body) {
    updateData.isPublicBadgeEnabled = Boolean(body.isPublicBadgeEnabled);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      notifyEmail: true,
      isPublicBadgeEnabled: true,
      // Never return discordWebhookUrl — it is encrypted and would be useless to client
    },
  });

  return NextResponse.json({ success: true, settings: updated });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notifyEmail: true,
      isPublicBadgeEnabled: true,
      discordWebhookUrl: true, // just whether it exists
    },
  });

  return NextResponse.json({
    notifyEmail: user?.notifyEmail ?? null,
    isPublicBadgeEnabled: user?.isPublicBadgeEnabled ?? false,
    hasDiscordWebhook: Boolean(user?.discordWebhookUrl),
  });
}
