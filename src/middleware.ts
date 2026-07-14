import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect dashboard and API routes.
 * - /dashboard/* → redirects to /login if unauthenticated
 * - /api/leetcode/*, /api/sync/*, /api/github/repos → returns 401 if unauthenticated
 */
export default auth((req: any) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;

  // Protect dashboard pages — redirect to login
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect API routes — return 401
  const protectedApiPrefixes = ["/api/leetcode", "/api/sync", "/api/github/repos"];
  if (protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/leetcode/:path*", "/api/sync/:path*", "/api/github/repos/:path*"],
};
