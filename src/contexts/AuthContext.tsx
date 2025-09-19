import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExplicitlySignedOut, setHasExplicitlySignedOut] = useState(false);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create a default user profile for new users
        const email = userEmail || session?.user?.email;
        if (email) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              email: email,
              role: 'user' // Default role is 'user', admin role must be assigned manually
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Don't set profile if creation failed
          } else {
            setProfile(newProfile);
          }
        } else {
          console.error('No email available for profile creation');
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          // Defer profile fetching with email parameter
          setTimeout(() => {
            fetchProfile(session.user.id, session.user.email);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session only if we haven't explicitly signed out
    if (!hasExplicitlySignedOut) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            fetchProfile(session.user.id, session.user.email);
          }, 0);
        } else {
          setLoading(false);
        }
      });
    } else {
      // If we explicitly signed out, don't restore session
      setLoading(false);
    }

    return () => subscription.unsubscribe();
  }, []); // Remove hasExplicitlySignedOut dependency to prevent infinite loops

  // Separate effect to handle explicit sign out flag
  useEffect(() => {
    if (hasExplicitlySignedOut) {
      // Don't restore session if user explicitly signed out
      setLoading(false);
    }
  }, [hasExplicitlySignedOut]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Reset the explicit sign out flag on successful sign in
    if (!error) {
      setHasExplicitlySignedOut(false);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
      if (key && key.startsWith('sb-xnkyfxvncpawqpqccdby-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};