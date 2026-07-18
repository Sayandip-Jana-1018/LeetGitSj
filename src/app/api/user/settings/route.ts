/**
 * PATCH /api/user/settings
 *
 * Updates user notification preferences and badge visibility.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    notifyEmail?: string | null;
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
    },
  });

  return NextResponse.json({
    notifyEmail: user?.notifyEmail ?? null,
    isPublicBadgeEnabled: user?.isPublicBadgeEnabled ?? false,
  });
}
