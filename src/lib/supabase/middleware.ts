import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * User status cache to reduce database queries
 * Cache TTL: 1 minute
 */
interface UserStatusCache {
  is_banned: boolean;
  role: string;
  timestamp: number;
}

const userStatusCache = new Map<string, UserStatusCache>();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Get user status from cache or database
 */
async function getUserStatus(
  userId: string,
  adminSupabase: any
): Promise<{ is_banned: boolean; role: string } | null> {
  const now = Date.now();

  // Check cache first
  const cached = userStatusCache.get(userId);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return {
      is_banned: cached.is_banned,
      role: cached.role,
    };
  }

  // Fetch from database
  const { data: userData, error } = await adminSupabase
    .from("users")
    .select("is_banned, role")
    .eq("id", userId)
    .single();

  if (error || !userData) {
    return null;
  }

  // Update cache
  userStatusCache.set(userId, {
    is_banned: userData.is_banned,
    role: userData.role,
    timestamp: now,
  });

  return userData;
}

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [userId, cached] of userStatusCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      userStatusCache.delete(userId);
    }
  }
}

// Clean up cache every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

export async function updateSession(request: NextRequest) {
  // Generate request ID for debugging
  const requestId = crypto.randomUUID();

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is banned (with caching)
  if (user) {
    try {
      // Create admin client for ban check
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // No-op for this check
            },
          },
        }
      );

      // Get user status (cached or fresh)
      const userData = await getUserStatus(user.id, adminSupabase);

      if (userData?.is_banned) {
        console.log(`[${requestId}] User ${user.id} is banned, signing out`);

        // Log out banned users
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/auth/banned", request.url));
      }
    } catch (error) {
      // Log error but don't block the request
      console.error(`[${requestId}] Error checking user status:`, error);
    }
  }

  return supabaseResponse;
}
