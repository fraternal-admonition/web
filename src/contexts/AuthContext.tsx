"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "USER" | "TESTER" | "ADMIN";

interface UserProfile {
  id: string;
  role: UserRole;
  display_id: string | null;
  country: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = async (
    userId: string,
    retries = 3
  ): Promise<UserProfile | null> => {
    console.log(
      `[AuthContext] Fetching profile for user: ${userId}, retries left: ${retries}`
    );
    
    try {
      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Session check timeout")), 3000)
      );
      
      const { data: { session: currentSession } } = await Promise.race([
        sessionPromise,
        timeoutPromise.then(() => ({ data: { session: null } }))
      ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
      
      if (!currentSession) {
        console.error("[AuthContext] No active session found");
        if (retries > 0) {
          console.log("[AuthContext] Retrying profile fetch...");
          await new Promise((resolve) => setTimeout(resolve, 800));
          return fetchProfile(userId, retries - 1);
        }
        return null;
      }
      
      console.log("[AuthContext] Session verified, access token present:", !!currentSession.access_token);
      
      // Fetch profile with timeout
      const fetchPromise = supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
        
      const fetchTimeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
      );
      
      const result = await Promise.race([
        fetchPromise,
        fetchTimeout.then(() => ({ data: null, error: { message: "Timeout" } }))
      ]);
      
      const { data, error } = result as { data: UserProfile | null; error: { message: string; code?: string } | null };

      if (error) {
        console.error("[AuthContext] Profile fetch error:", error);
        
        // If it's a timeout or network error, retry
        if (error.message === "Timeout" && retries > 0) {
          console.log(`[AuthContext] Fetch timed out, retrying... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        
        // If profile not found and we have retries, wait and try again
        if (error.code === "PGRST116" && retries > 0) {
          console.log(
            `[AuthContext] Profile not found, retrying... (${retries} attempts left)`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        
        console.error("[AuthContext] Profile fetch failed permanently:", error);
        return null;
      }

      console.log("[AuthContext] Profile fetched successfully:", data);
      return data as UserProfile;
    } catch (error) {
      console.error("[AuthContext] Unexpected error in fetchProfile:", error);
      if (retries > 0) {
        console.log(
          `[AuthContext] Retrying due to exception... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchProfile(userId, retries - 1);
      }
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "[AuthContext] Auth state changed:",
        event,
        "User:",
        session?.user?.email
      );

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("[AuthContext] User found, fetching profile...");
        // Don't set loading false until profile is fetched
        const profileData = await fetchProfile(session.user.id);
        console.log("[AuthContext] Profile data received:", profileData);
        setProfile(profileData);

        // Check if user is banned
        if (profileData?.is_banned) {
          console.log("[AuthContext] User is banned, signing out...");
          await supabase.auth.signOut();
          router.push("/auth/banned");
          return; // Don't set loading false if redirecting
        }

        console.log("[AuthContext] Setting loading to false");
        setLoading(false);
      } else {
        console.log("[AuthContext] No user, clearing profile and setting loading to false");
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const signOut = async () => {
    try {
      // Set a timeout for the sign out operation
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign out timeout")), 5000)
      );

      // Race between sign out and timeout
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.error("Error signing out:", error);
      // Continue anyway - we'll clear the local state
    } finally {
      // Always clear local state and redirect, even if sign out fails
      setUser(null);
      setProfile(null);
      setSession(null);

      // Clear all Supabase cookies manually
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.split("=")[0].trim();
        if (cookieName.startsWith("sb-")) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });

      router.push("/");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, session, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useProfile() {
  const { profile } = useAuth();
  return profile;
}

export function useSession() {
  const { session } = useAuth();
  return session;
}
