import React, { useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { authSupabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { AuthContext, type Profile } from "./AuthContextDefinition";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExplicitlySignedOut, setHasExplicitlySignedOut] = useState(false);

  // Only initialize auth on admin routes
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Add refs for request cancellation and debouncing
  const fetchProfileAbortController = useRef<AbortController | null>(null);
  const fetchProfileTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    // Cancel any existing request
    if (fetchProfileAbortController.current) {
      fetchProfileAbortController.current.abort();
    }

    // Clear any existing timeout
    if (fetchProfileTimeout.current) {
      clearTimeout(fetchProfileTimeout.current);
    }

    // Create new abort controller
    fetchProfileAbortController.current = new AbortController();

    try {
      const { data, error } = await authSupabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create a default user profile for new users
        const email = userEmail;
        if (email) {
          const { data: newProfile, error: insertError } = await authSupabase
            .from("profiles")
            .insert({
              user_id: userId,
              email: email,
              role: "user", // Default role is 'user', admin role must be assigned manually
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating user profile:", insertError);
            // Don't set profile if creation failed
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error("No email available for profile creation");
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error in fetchProfile:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Remove session?.user?.email dependency to prevent race condition

  useEffect(() => {
    // Only initialize auth on admin routes to prevent cookies on non-admin routes
    if (!isAdminRoute) {
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const {
      data: { subscription },
    } = authSupabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        // Debounce fetchProfile calls to prevent race conditions
        if (fetchProfileTimeout.current) {
          clearTimeout(fetchProfileTimeout.current);
        }
        fetchProfileTimeout.current = setTimeout(() => {
          fetchProfile(session.user.id, session.user.email);
        }, 100);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Check for existing session only if we haven't explicitly signed out
    if (!hasExplicitlySignedOut) {
      authSupabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          // Debounce fetchProfile calls to prevent race conditions
          if (fetchProfileTimeout.current) {
            clearTimeout(fetchProfileTimeout.current);
          }
          fetchProfileTimeout.current = setTimeout(() => {
            fetchProfile(session.user.id, session.user.email);
          }, 100);
        } else {
          setLoading(false);
        }
      });
    } else {
      // If we explicitly signed out, don't restore session
      setLoading(false);
    }

    return () => {
      subscription.unsubscribe();
      // Cleanup timeouts and abort controllers
      if (fetchProfileTimeout.current) {
        clearTimeout(fetchProfileTimeout.current);
      }
      if (fetchProfileAbortController.current) {
        fetchProfileAbortController.current.abort();
      }
    };
  }, [hasExplicitlySignedOut, isAdminRoute, fetchProfile]); // Add fetchProfile dependency

  // Separate effect to handle explicit sign out flag
  useEffect(() => {
    if (hasExplicitlySignedOut) {
      // Don't restore session if user explicitly signed out
      setLoading(false);
    }
  }, [hasExplicitlySignedOut]);

  const signIn = async (email: string, password: string) => {
    // Only allow sign in on admin routes
    if (!isAdminRoute) {
      return { error: new Error("Authentication only available on admin routes") };
    }

    const { error } = await authSupabase.auth.signInWithPassword({
      email,
      password,
    });

    // Reset the explicit sign out flag on successful sign in
    if (!error) {
      setHasExplicitlySignedOut(false);
    }

    return { error };
  };

  const signOut = async () => {
    // Only allow sign out on admin routes
    if (!isAdminRoute) {
      return;
    }

    await authSupabase.auth.signOut();
    // Clear all auth state immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    setHasExplicitlySignedOut(true);

    // Clear any remaining session data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-xnkyfxvncpawqpqccdby-")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
