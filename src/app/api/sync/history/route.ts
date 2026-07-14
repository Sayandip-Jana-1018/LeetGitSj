import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sync/history
 * Returns paginated sync history for the dashboard.
 * Query params: ?page=1&limit=20&type=submissions|logs
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const type = searchParams.get("type") ?? "submissions";
  const offset = (page - 1) * limit;

  if (type === "logs") {
    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({
        where: { userId: session.user.id },
        orderBy: { runAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.syncLog.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  // Default: submissions
  const [submissions, total] = await Promise.all([
    prisma.syncedSubmission.findMany({
      where: { userId: session.user.id },
      orderBy: { syncedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.syncedSubmission.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    data: submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
