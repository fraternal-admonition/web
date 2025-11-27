"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";
import {
  profileCache,
  activityTracker,
  AuthStateMachine,
  AuthState,
  SessionManager,
  logger,
  toAuthError,
  getUserFriendlyMessage,
  type UserProfile,
  type AuthError,
} from "@/lib/auth";

interface AuthContextType {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;

  // Session info
  sessionExpiry: Date | null;
  lastActivity: Date | null;

  // Actions
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Session info
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Session expiry warning
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [expiryTimeRemaining, setExpiryTimeRemaining] = useState(300); // 5 minutes

  // Debug: Log when modal state changes
  useEffect(() => {
    console.log("📊 Modal state changed:", {
      showExpiryWarning,
      expiryTimeRemaining,
      hasSessionManager: !!sessionManagerRef.current,
    });
  }, [showExpiryWarning, expiryTimeRemaining]);

  // Refs for managers (don't trigger re-renders)
  const stateMachineRef = useRef<AuthStateMachine | null>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Initialize state machine
  if (!stateMachineRef.current) {
    stateMachineRef.current = new AuthStateMachine(AuthState.INITIALIZING);
    logger.info("AuthContext initialized");
  }

  const stateMachine = stateMachineRef.current;

  // Fetch profile using ProfileCache
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      logger.info("Fetching profile", { userId });

      const profileData = await profileCache.getProfile(userId, supabase);

      if (!profileData) {
        logger.warn("Profile not found", { userId });
        return null;
      }

      logger.info("Profile fetched successfully", { userId });
      return profileData;
    } catch (err) {
      const authError = toAuthError(err, "fetchProfile");
      logger.error("Profile fetch failed", authError);
      setError(authError);
      return null;
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (!user) {
      logger.warn("Cannot refresh profile: no user");
      return;
    }

    logger.info("Refreshing profile", { userId: user.id });

    // Invalidate cache first
    profileCache.invalidate(user.id);

    // Fetch fresh profile
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  // Refresh session
  const refreshSession = async () => {
    console.log("🔄 AuthContext.refreshSession() called");
    
    if (!sessionManagerRef.current) {
      console.error("❌ No session manager available");
      logger.warn("Cannot refresh session: no session manager");
      return;
    }

    console.log("📞 Calling sessionManager.refreshSession()...");
    logger.info("Refreshing session");

    const newSession = await sessionManagerRef.current.refreshSession();

    if (newSession) {
      console.log("✅ Session refresh successful in AuthContext");
      console.log("Updating session state...");
      setSession(newSession);
      setSessionExpiry(
        newSession.expires_at ? new Date(newSession.expires_at * 1000) : null
      );
      console.log("Session state updated:", {
        expiresAt: newSession.expires_at,
        expiryDate: new Date(newSession.expires_at! * 1000).toLocaleString(),
      });
      logger.info("Session refreshed successfully");
    } else {
      console.error("❌ Session refresh failed in AuthContext");
      logger.error("Session refresh failed");
      const authError = toAuthError(
        new Error("Failed to refresh session"),
        "refreshSession"
      );
      setError(authError);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
    logger.debug("Error cleared");
  };

  // Handle session expiry
  const handleSessionExpiry = () => {
    logger.info("Session expired, signing out");

    stateMachine.transition(AuthState.EXPIRED);

    // Sign out
    signOut();
  };

  // Handle session warning (5 minutes before expiry)
  const handleSessionWarning = () => {
    logger.warn("Session expiring soon");

    console.log("🚨 handleSessionWarning called!");
    
    // Calculate actual time remaining
    const timeRemaining = sessionManagerRef.current?.getTimeUntilExpiry() || 0;
    const timeRemainingSeconds = Math.floor(timeRemaining / 1000);
    
    console.log("Time remaining (ms):", timeRemaining);
    console.log("Time remaining (seconds):", timeRemainingSeconds);

    // Show expiry warning modal
    setShowExpiryWarning(true);
    setExpiryTimeRemaining(timeRemainingSeconds);
    
    console.log("showExpiryWarning set to:", true);
    console.log("expiryTimeRemaining set to:", timeRemainingSeconds);
  };

  // Handle stay signed in
  const handleStaySignedIn = async () => {
    console.log("👤 User clicked 'Stay Signed In' button");
    console.log("Closing modal...");
    setShowExpiryWarning(false);
    console.log("Calling refreshSession...");
    await refreshSession();
    console.log("✅ Stay signed in flow complete");
  };

  // Handle sign out from warning
  const handleSignOutFromWarning = async () => {
    setShowExpiryWarning(false);
    await signOut();
  };

  // Sign out
  const signOut = async () => {
    logger.info("Signing out");

    // Transition to signing out state
    stateMachine.transition(AuthState.SIGNING_OUT);

    try {
      // Stop session manager
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stopMonitoring();
      }

      // Stop activity tracker
      activityTracker.stop();

      // Clear profile cache
      profileCache.clear();

      // Set a timeout for the sign out operation
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign out timeout")), 5000)
      );

      // Race between sign out and timeout
      await Promise.race([signOutPromise, timeoutPromise]);

      logger.info("Sign out successful");
    } catch (err) {
      logger.error("Error signing out", err);
      // Continue anyway - we'll clear the local state
    } finally {
      // Always clear local state and redirect, even if sign out fails
      setUser(null);
      setProfile(null);
      setSession(null);
      setSessionExpiry(null);
      setLastActivity(null);

      // Clear all Supabase cookies manually
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.split("=")[0].trim();
          if (cookieName.startsWith("sb-")) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }

      // Transition to unauthenticated
      stateMachine.transition(AuthState.UNAUTHENTICATED);

      router.push("/");
      router.refresh();
    }
  };

  // Initialize auth state
  useEffect(() => {
    logger.info("Initializing auth state");

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        logger.info("Initial session found", { userId: session.user.id });

        // Fetch profile
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);

        // Check if user is banned
        if (profileData?.is_banned) {
          logger.warn("User is banned", { userId: session.user.id });
          await supabase.auth.signOut();
          router.push("/auth/banned");
          return;
        }

        // Set session expiry
        if (session.expires_at) {
          setSessionExpiry(new Date(session.expires_at * 1000));
        }

        // Initialize session manager
        console.log("🔧 Initializing SessionManager with callbacks");
        sessionManagerRef.current = new SessionManager(
          supabase,
          handleSessionExpiry,
          handleSessionWarning,
          activityTracker
        );

        // Start monitoring session
        console.log("▶️ Starting session monitoring");
        sessionManagerRef.current.startMonitoring(session);
        
        // Debug: Log session manager stats
        const stats = sessionManagerRef.current.getStats();
        console.log("📈 SessionManager stats:", stats);

        // Transition to authenticated
        stateMachine.transition(AuthState.AUTHENTICATED, {
          userId: session.user.id,
        });

        // Update last activity
        setLastActivity(activityTracker.getLastActivity());
      } else {
        logger.info("No initial session found");
        stateMachine.transition(AuthState.UNAUTHENTICATED);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info("Auth state changed", { event, userId: session?.user?.id });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch profile
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);

        // Check if user is banned
        if (profileData?.is_banned) {
          logger.warn("User is banned", { userId: session.user.id });
          await supabase.auth.signOut();
          router.push("/auth/banned");
          return;
        }

        // Set session expiry
        if (session.expires_at) {
          setSessionExpiry(new Date(session.expires_at * 1000));
        }

        // Initialize or restart session manager
        if (!sessionManagerRef.current) {
          console.log("🔧 Initializing SessionManager (auth state change)");
          sessionManagerRef.current = new SessionManager(
            supabase,
            handleSessionExpiry,
            handleSessionWarning,
            activityTracker
          );
        }

        console.log("▶️ Starting session monitoring (auth state change)");
        sessionManagerRef.current.startMonitoring(session);
        
        // Debug: Log session manager stats
        const stats = sessionManagerRef.current.getStats();
        console.log("📈 SessionManager stats (auth state change):", stats);

        // Transition to authenticated
        if (!stateMachine.isAuthenticated()) {
          stateMachine.transition(AuthState.AUTHENTICATED, {
            userId: session.user.id,
          });
        }

        // Update last activity
        setLastActivity(activityTracker.getLastActivity());

        setLoading(false);
      } else {
        logger.info("User signed out");

        // Stop session manager
        if (sessionManagerRef.current) {
          sessionManagerRef.current.stopMonitoring();
        }

        // Stop activity tracker
        activityTracker.stop();

        // Clear state
        setProfile(null);
        setSessionExpiry(null);
        setLastActivity(null);

        // Transition to unauthenticated
        if (!stateMachine.isUnauthenticated()) {
          stateMachine.transition(AuthState.UNAUTHENTICATED);
        }

        setLoading(false);
      }
    });

    // Subscribe to activity events
    const unsubscribeActivity = activityTracker.onActivity(() => {
      setLastActivity(activityTracker.getLastActivity());
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
      unsubscribeActivity();

      // Stop managers
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stopMonitoring();
      }
      activityTracker.stop();
    };
  }, [router, supabase.auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        sessionExpiry,
        lastActivity,
        signOut,
        refreshProfile,
        refreshSession,
        clearError,
      }}
    >
      {children}
      
      {/* Session Expiry Warning Modal */}
      <SessionExpiryWarning
        isOpen={showExpiryWarning}
        timeRemaining={expiryTimeRemaining}
        onStaySignedIn={handleStaySignedIn}
        onSignOut={handleSignOutFromWarning}
      />
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
