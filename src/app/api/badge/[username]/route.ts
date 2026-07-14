/**
 * GET /api/badge/[username]
 *
 * Returns an SVG shield for opted-in users.
 * Returns the SAME generic "not available" SVG for:
 *   - user not found
 *   - badge disabled (isPublicBadgeEnabled = false)
 * This prevents enumeration — you cannot tell if a user exists.
 */

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const UNAVAILABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="170" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="170" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="80" height="20" fill="#555"/>
    <rect x="80" width="90" height="20" fill="#9f9f9f"/>
    <rect width="170" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="405" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="700" lengthAdjust="spacing">leetpush</text>
    <text x="405" y="140" transform="scale(.1)" textLength="700" lengthAdjust="spacing">leetpush</text>
    <text x="1205" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="800" lengthAdjust="spacing">not available</text>
    <text x="1205" y="140" transform="scale(.1)" textLength="800" lengthAdjust="spacing">not available</text>
  </g>
</svg>`;

function buildBadgeSvg(username: string, count: number, streak: number): string {
  const label = "leetpush";
  const value = `${count} solved · ${streak}d streak`;
  const labelWidth = 75;
  const valueWidth = Math.max(value.length * 6.5 + 10, 90);
  const totalWidth = labelWidth + valueWidth;
  const labelX = labelWidth / 2;
  const valueX = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#0d9488"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${Math.round(labelX * 10)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" lengthAdjust="spacing">${label}</text>
    <text x="${Math.round(labelX * 10)}" y="140" transform="scale(.1)" lengthAdjust="spacing">${label}</text>
    <text x="${Math.round(valueX * 10)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" lengthAdjust="spacing">${value}</text>
    <text x="${Math.round(valueX * 10)}" y="140" transform="scale(.1)" lengthAdjust="spacing">${value}</text>
  </g>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const svgHeaders = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };

  try {
    // Always query the same fields — anti-enumeration
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: username },
          { leetcodeCredential: { leetcodeUsername: username } },
        ],
        isPublicBadgeEnabled: true,
      },
      select: {
        isPublicBadgeEnabled: true,
        _count: { select: { syncedSubmissions: true } },
        syncedSubmissions: {
          orderBy: { syncedAt: "desc" },
          select: { syncedAt: true },
        },
      },
    });

    if (!user || !user.isPublicBadgeEnabled) {
      // Same response for missing OR private — prevents enumeration
      return new NextResponse(UNAVAILABLE_SVG, { headers: svgHeaders });
    }

    const count = user._count.syncedSubmissions;

    // Compute streak from submission dates
    let streak = 0;
    const submissionDays = [
      ...new Set(
        user.syncedSubmissions.map((s) =>
          new Date(s.syncedAt).toISOString().split("T")[0]
        )
      ),
    ].sort((a, b) => b.localeCompare(a));

    if (submissionDays.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (submissionDays[0] === today || submissionDays[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < submissionDays.length; i++) {
          const prev = new Date(submissionDays[i - 1]);
          const curr = new Date(submissionDays[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff === 1) streak++;
          else break;
        }
      }
    }

    const svg = buildBadgeSvg(username, count, streak);
    return new NextResponse(svg, { headers: svgHeaders });
  } catch {
    return new NextResponse(UNAVAILABLE_SVG, { headers: svgHeaders });
  }
}
