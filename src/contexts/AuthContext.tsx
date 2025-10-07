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
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile not found and we have retries, wait and try again
        if (error.code === "PGRST116" && retries > 0) {
          console.log(
            `Profile not found, retrying... (${retries} attempts left)`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        console.error("Error fetching profile:", error);
        return null;
      }

      console.log("Profile fetched successfully:", data);
      return data as UserProfile;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      if (retries > 0) {
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
      console.log("Auth state changed:", event, "User:", session?.user?.email);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Don't set loading false until profile is fetched
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);

        // Check if user is banned
        if (profileData?.is_banned) {
          await supabase.auth.signOut();
          router.push("/auth/banned");
        }

        setLoading(false);
      } else {
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
