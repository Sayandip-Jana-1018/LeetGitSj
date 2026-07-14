import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * DELETE /api/leetcode/disconnect
 * Hard-deletes the LeetCode credential and all synced submission records.
 * This is the "Disconnect & delete all my data" action.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Delete in order: submissions, logs, credential
  await prisma.$transaction([
    prisma.syncedSubmission.deleteMany({ where: { userId } }),
    prisma.syncLog.deleteMany({ where: { userId } }),
    prisma.leetCodeCredential.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    success: true,
    message: "LeetCode credential and all synced data deleted",
  });
}
