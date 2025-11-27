import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimiter } from "@/lib/security/rate-limit";
import { settingsCache } from "@/lib/cms/settings-cache";
import { validatePasswordSession } from "@/lib/security/site-lock-session";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Check if this is an admin subdomain request
  const isAdminSubdomain = hostname.startsWith("admin.");
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isAdminPath = url.pathname.startsWith("/admin");
  const isAuthPath = url.pathname.startsWith("/auth");
  const isApiPath = url.pathname.startsWith("/api");

  // Rate limiting for admin API routes
  if (isApiPath && url.pathname.startsWith("/api/admin")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const identifier = `ip:${ip}`;

    // 1000 requests per hour per IP
    const result = await rateLimiter.checkLimit(identifier, 1000, 60 * 60 * 1000);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          resetAt: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "1000",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetAt.toISOString(),
            "Retry-After": Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await updateSession(request);
    response.headers.set("X-RateLimit-Limit", "1000");
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());
    return response;
  }

  // Production: Enforce subdomain routing
  if (!isLocalDev) {
    // If on admin subdomain
    if (isAdminSubdomain) {
      // Allow auth and api routes to pass through normally
      if (!isAuthPath && !isApiPath && !isAdminPath) {
        // Rewrite root and other paths to /admin
        url.pathname = `/admin${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }

    // If trying to access /admin on main domain, redirect to home
    if (!isAdminSubdomain && isAdminPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Local dev: Allow direct /admin access for easier testing
  // In production, admin routes are only accessible via admin.fraternaladmonition.com

  // Skip settings checks for admin routes, auth routes, API routes, maintenance page, and site-lock page
  const isMaintenancePage = url.pathname === "/maintenance";
  const isSiteLockPage = url.pathname === "/site-lock";

  if (isAdminPath || isAuthPath || isApiPath || isMaintenancePage || isSiteLockPage) {
    return await updateSession(request);
  }

  // Check maintenance mode and site lock settings
  try {
    const settings = await settingsCache.get();

    // Get user to check if admin
    // Create Supabase client compatible with middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in middleware for read-only operations
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "ADMIN";
    }

    // Admins bypass all locks
    if (isAdmin) {
      return await updateSession(request);
    }

    // Maintenance Mode Check (takes precedence over site lock)
    if (settings.maintenance_mode) {
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }

    // Site Lock Check - Authentication Mode (Admin Only)
    // In auth mode, only ADMIN users can access the site
    if (settings.site_lock_mode === 'auth') {
      if (!user) {
        // No user logged in - redirect to sign in
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('redirect', url.pathname);
        return NextResponse.redirect(signInUrl);
      }
      
      // User is logged in but not admin - show access denied
      if (!isAdmin) {
        return NextResponse.rewrite(new URL('/auth/access-denied', request.url));
      }
    }

    // Site Lock Check - Password Mode
    if (settings.site_lock_mode === 'password') {
      // Check if user has valid password session (pass request for cookie access)
      const hasValidSession = await validatePasswordSession(
        settings.site_lock_password_hash,
        request
      );

      if (!hasValidSession) {
        const siteLockUrl = new URL('/site-lock', request.url);
        siteLockUrl.searchParams.set('redirect', url.pathname);
        return NextResponse.redirect(siteLockUrl);
      }
    }
  } catch (error) {
    console.error("[Middleware] Settings error:", error);
    // Fail open - allow request through if settings check fails
  }

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
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
