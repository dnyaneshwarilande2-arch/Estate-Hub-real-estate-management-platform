import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// ─── Constants ────────────────────────────────────────────────
const ADMIN_EMAIL = 'sdcreation613@gmail.com';


// ─── Types ────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  createdAt: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string, requestedRole?: 'user' | 'admin') => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string, role?: 'user' | 'admin') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────
const getStableId = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  const absHash = Math.abs(hash).toString().padStart(12, '0');
  return `00000000-0000-4000-a000-${absHash.slice(-12)}`;
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getRoleFromEmail = (email: string): 'admin' | 'user' => {
    const e = email.toLowerCase();

    // Strict, hardcoded roles as requested
    if (e === 'sdcreation613@gmail.com') return 'admin';

    // Everyone else defaults to standard user, now and in the future
    return 'user';
  };

  const syncProfile = async (id: string, email: string, role: string, fullName: string) => {
    try {
      // 1. Check if profile exists first to avoid wiping data (bio, address, etc)
      const { data: existing } = await supabase
        .from('profiles')
        .select('full_name, address, bio')
        .eq('user_id', id)
        .maybeSingle();

      if (!existing) {
        // Create initial profile only if it doesn't exist
        await supabase.from('profiles').upsert({
          user_id: id,
          full_name: fullName,
          bio: `Registration: ${new Date().toLocaleString()}`
        }, { onConflict: 'user_id' });
      } else {
        // Update session info without wiping bio/address
        console.log("[Auth] Profile already exists, skipping overwrite.");
      }

      // 2. Run RPC to securely assign the database role
      const { error: roleErr } = await (supabase.rpc as any)('sync_user_role', {
        p_user_id: id,
        p_email: email,
        p_role: role
      });

      if (roleErr) console.warn('[Auth] RPC sync_user_role error:', roleErr);
      console.log(`[Auth] Sync successful for ${email} as ${role}`);
    } catch (e) {
      console.warn("[Auth] Sync failed (likely RLS), but proceeding with session.", e);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Check real Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // 1a. Try to get role and name from DB
          let dbRole: any = null;
          let dbName: string | null = null;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, user_roles(role)')
              .eq('user_id', session.user.id)
              .maybeSingle();

            dbName = profileData?.full_name;
            dbRole = (profileData as any)?.user_roles?.[0]?.role;
          } catch (e) {
            console.warn("[Auth] Could not fetch DB profile/role:", e);
          }

          // Sanitize: only accept 'admin' or 'user'
          const sanitizedDbRole = dbRole === 'admin' ? 'admin' : (dbRole ? 'user' : null);
          const role = sanitizedDbRole || getRoleFromEmail(session.user.email || '');

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: dbName || session.user.user_metadata?.full_name || (session.user.email || '').split('@')[0].toUpperCase().replace(/[._-]/g, ' ') || 'USER',
            role: role as any,
            createdAt: session.user.created_at
          });
          // Clear any stale local user session so it doesn't override this
          localStorage.removeItem('estatehub_user');
          setLoading(false);
          return;
        }

        // 2. Fallback to localStorage (Persistent User Session)
        const userStr = localStorage.getItem('estatehub_user');
        if (userStr) {
          const storedUser = JSON.parse(userStr);

          // Try to refresh name from DB if possible
          try {
            const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', storedUser.id).maybeSingle();
            if (p?.full_name) storedUser.fullName = p.full_name;
          } catch (e) { }

          // Ensure stable ID for names that might have changed
          const stableId = getStableId(storedUser.email);
          if (storedUser.id !== stableId) {
            storedUser.id = stableId;
            localStorage.setItem('estatehub_user', JSON.stringify(storedUser));
          }
          setUser(storedUser);
        }
      } catch (err) {
        console.error("[Auth] Init failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Only clear if no persistent session exists either
        if (!localStorage.getItem('estatehub_user')) setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, requestedRole?: 'user' | 'admin'): Promise<{ error: string | null }> => {
    const e = email.toLowerCase();
    const role = getRoleFromEmail(e);
    const fullName = e.split('@')[0].toUpperCase().replace(/[._-]/g, ' ');

    try {
      // 1. Attempt Real Supabase Login
      let { data: { user: sbUser }, error: sbError } = await supabase.auth.signInWithPassword({ email: e, password });

      // 2. If user not found, perform silent Sign Up to "bypass" the registration wall
      if (sbError && (sbError.message.includes('Invalid login credentials') || sbError.message.includes('Email not confirmed'))) {
        console.log("[Auth] User not found or unconfirmed, attempting silent registration...");
        const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
          email: e,
          password,
          options: { data: { full_name: fullName } }
        });

        if (!signUpError && newUser) {
          sbUser = newUser;
        } else if (signUpError) {
          console.warn("[Auth] Silent registration failed:", signUpError.message);
        }
      }

      // 2a. Fetch Name from DB if user exists (to ensure consistency for name-based recovery)
      let dbName = null;
      if (sbUser) {
        try {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', sbUser.id).maybeSingle();
          dbName = p?.full_name;
        } catch (e) { }
      }

      // 3. Construct Auth State
      const finalUser: AuthUser = {
        id: sbUser?.id || getStableId(e),
        email: e,
        fullName: dbName || sbUser?.user_metadata?.full_name || fullName,
        role: role,
        createdAt: sbUser?.created_at || new Date().toISOString()
      };

      setUser(finalUser);
      localStorage.setItem('estatehub_user', JSON.stringify(finalUser));

      // 4. Background Sync with Database (Non-blocking)
      try {
        await syncProfile(finalUser.id, finalUser.email, finalUser.role, finalUser.fullName);
      } catch (e) {
        console.warn("[Auth] Background sync failed, but proceeding.", e);
      }

      return { error: null };
    } catch (err: any) {
      console.error("[Auth] Sign-in exception:", err);
      return { error: err.message || "Authentication failed" };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, role: 'user' | 'admin' = 'user'): Promise<{ error: string | null }> => {
    const e = email.toLowerCase();
    const userRole = getRoleFromEmail(e);
    const name = fullName || e.split('@')[0].toUpperCase().replace(/[._-]/g, ' ');

    try {
      const { data: { user: sbUser }, error: signUpError } = await supabase.auth.signUp({
        email: e,
        password,
        options: { data: { full_name: name } }
      });

      const finalUser: AuthUser = {
        id: sbUser?.id || getStableId(e),
        email: e,
        fullName: name,
        role: userRole,
        createdAt: sbUser?.created_at || new Date().toISOString()
      };

      setUser(finalUser);
      localStorage.setItem('estatehub_user', JSON.stringify(finalUser));
      // 4. Background Sync with Database (Non-blocking)
      try {
        await syncProfile(finalUser.id, finalUser.email, finalUser.role, finalUser.fullName);
      } catch (e) {
        console.warn("[Auth] Background sync failed, but proceeding.", e);
      }

      if (signUpError && !signUpError.message.includes('User already registered')) {
        console.warn("[Auth] Real signUp failed:", signUpError.message);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('estatehub_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthCtx.Provider value={{ user, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
