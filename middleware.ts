import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Check if this is an admin subdomain request
  const isAdminSubdomain = hostname.startsWith("admin.");
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isAdminPath = url.pathname.startsWith("/admin");

  // Production: Enforce subdomain routing
  if (!isLocalDev) {
    // If on admin subdomain, rewrite to /admin path
    if (isAdminSubdomain && !isAdminPath) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }

    // If trying to access /admin on main domain, redirect to home
    if (!isAdminSubdomain && isAdminPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Local dev: Allow direct /admin access for easier testing
  // In production, admin routes are only accessible via admin.fraternaladmonition.com

  // Continue with auth session update
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
