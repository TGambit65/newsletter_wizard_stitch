import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, Tenant } from '@/lib/supabase';

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
      (_event, session) => {
        setUser(session?.user || null);
        setSession(session);
        if (!session?.user) {
          setProfile(null);
          setTenant(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfileAndTenant(userId: string) {
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
        data: { full_name: fullName }
      }
    });

    if (!error && data.user) {
      // Create tenant and profile
      const tenantSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { data: tenantData } = await supabase
        .from('tenants')
        .insert({
          name: fullName || email.split('@')[0],
          slug: `${tenantSlug}-${Date.now()}`,
          subscription_tier: 'free'
        })
        .select()
        .maybeSingle();

      if (tenantData) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          tenant_id: tenantData.id,
          email,
          full_name: fullName,
          role: 'owner'
        });
        setProfile({
          id: data.user.id,
          tenant_id: tenantData.id,
          email,
          full_name: fullName,
          avatar_url: null,
          role: 'owner',
          timezone: 'UTC',
          is_active: true,
          created_at: new Date().toISOString()
        });
        setTenant(tenantData);
      }
    }
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
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { error: error as Error | null };
  }

  return (
    <AuthContext.Provider value={{ user, profile, tenant, session, loading, signIn, signUp, signOut, resetPassword }}>
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
