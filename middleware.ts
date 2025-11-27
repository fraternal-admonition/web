import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimiter } from "@/lib/security/rate-limit";
import { settingsCache } from "@/lib/cms/settings-cache";

export async function middleware(request: NextRequest) {
  // FIRST LOG - This should appear if middleware runs at all
  console.log("🔥🔥🔥 MIDDLEWARE EXECUTING 🔥🔥🔥");
  
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Force log to appear
  console.error("[MIDDLEWARE] ===== MIDDLEWARE IS RUNNING =====", url.pathname);
  console.log("[Middleware] ===== START =====", url.pathname);

  // Check if this is an admin subdomain request
  const isAdminSubdomain = hostname.startsWith("admin.");
  const isLocalDev =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const isAdminPath = url.pathname.startsWith("/admin");
  const isAuthPath = url.pathname.startsWith("/auth");
  const isApiPath = url.pathname.startsWith("/api");
  
  console.log("[Middleware] Path checks:", {
    isAdminPath,
    isAuthPath,
    isApiPath,
    isLocalDev,
  });

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

  // Skip settings checks for admin routes, auth routes, API routes, and maintenance page
  const isMaintenancePage = url.pathname === "/maintenance";
  console.log("[Middleware] Maintenance page check:", isMaintenancePage);
  
  if (isAdminPath || isAuthPath || isApiPath || isMaintenancePage) {
    console.log("[Middleware] Skipping settings check (admin/auth/api/maintenance path)");
    return await updateSession(request);
  }
  
  console.log("[Middleware] Proceeding to settings check...");

  // Check maintenance mode and site lock settings
  try {
    console.log("[Middleware] Checking settings for path:", url.pathname);
    const settings = await settingsCache.get();
    console.log("[Middleware] Settings loaded:", {
      maintenance_mode: settings.maintenance_mode,
      site_lock_mode: settings.site_lock_mode,
    });

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
    console.log("[Middleware] User:", user ? `${user.id} (${user.email})` : "none");

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "ADMIN";
      console.log("[Middleware] User role:", profile?.role, "isAdmin:", isAdmin);
    }

    // Maintenance Mode Check (takes precedence)
    if (settings.maintenance_mode && !isAdmin) {
      console.log("[Middleware] MAINTENANCE MODE: Redirecting non-admin to /maintenance");
      return NextResponse.rewrite(new URL("/maintenance", request.url));
    }

    if (settings.maintenance_mode && isAdmin) {
      console.log("[Middleware] MAINTENANCE MODE: Admin bypassing, allowing access");
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
