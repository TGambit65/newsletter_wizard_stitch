import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, Tenant } from '@/lib/supabase';
import { createWorkspace } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(user);
        setSession(session);

        if (user) {
          await loadProfileAndTenant(user.id);
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setSession(session);
        if (!session?.user) {
          setProfile(null);
          setTenant(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Reload profile and tenant on sign-in and token refresh.
          // loadProfileAndTenant auto-creates a workspace if none exists
          // (handles the email-confirmation flow where workspace isn't created
          //  until after the user confirms and logs in for the first time).
          loadProfileAndTenant(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // autoCreate = true: if no profile found, call create-workspace edge function
  // autoCreate = false: reload only (used after workspace was just created)
  async function loadProfileAndTenant(userId: string, autoCreate = true) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profileData.tenant_id)
        .maybeSingle();
      setTenant(tenantData);
    } else if (autoCreate) {
      // No profile yet — create workspace server-side (atomic tenant + profile).
      // This throws if the edge function fails, letting callers handle the error.
      await createWorkspace();
      // Reload now that workspace exists
      await loadProfileAndTenant(userId, false);
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await loadProfileAndTenant(data.user.id);
    }
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });

    if (!error && data.user && data.session) {
      // Session is immediately available (email confirmation disabled or auto-confirmed).
      // Workspace is created atomically via the create-workspace edge function.
      try {
        await loadProfileAndTenant(data.user.id);
      } catch (setupError) {
        // Sign out to prevent a broken logged-in state (auth user, no workspace)
        await supabase.auth.signOut();
        return { error: new Error('Account setup failed. Please try signing up again.') };
      }
    }
    // If data.session is null (email confirmation required), the workspace will be
    // created automatically when the user confirms and SIGNED_IN fires.
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setTenant(null);
    setSession(null);
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error as Error | null };
  }

  async function reloadProfile() {
    if (user) {
      await loadProfileAndTenant(user.id);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, tenant, session, loading, signIn, signUp, signOut, resetPassword, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
