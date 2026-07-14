import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware — checks for the auth session cookie WITHOUT
 * invoking Prisma (which does not run on the Edge runtime).
 * Full session validation still happens in each server component / API route
 * via the `auth()` helper which runs in the Node.js runtime.
 */
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Look for the Auth.js session cookie (works for both "database" strategies)
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  // Protect dashboard pages — redirect to login
  if (pathname.startsWith("/dashboard") && !hasSession) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes — return 401
  const protectedApiPrefixes = ["/api/leetcode", "/api/sync", "/api/github/repos"];
  if (protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!hasSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/leetcode/:path*", "/api/sync/:path*", "/api/github/repos/:path*"],
};

