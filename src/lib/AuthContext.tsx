import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  profileReady: boolean;  // true once DB profile is confirmed
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  profileReady: false,
  signOut: async () => {},
  isLoading: false,
});

export const useAuth = () => useContext(AuthContext);

// --- Helpers ---

/** Build a minimal profile instantly from Auth JWT metadata — no DB query needed */
function buildProfileFromUser(user: User): any {
  return {
    auth_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email || 'Người dùng',
    role: user.user_metadata?.role || 'student',
    grade: user.user_metadata?.grade || '',
    // Default to 'active' for teachers, 'pending' for students
    // This will be updated once the background DB fetch completes
    status: user.user_metadata?.role === 'teacher' ? 'active' : 'pending',
    overall_progress: 0,
  };
}

/** Enrich profile with real data from public.users (status, progress, etc.) - runs in background */
async function fetchDBProfile(authId: string) {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

// ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  // isLoading only true on initial mount to restore existing session
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = (u: User | null) => {
    if (!u) {
      setProfile(null);
      setProfileReady(false);
      return;
    }
    // Step 1: set profile instantly from JWT metadata — zero wait
    const instant = buildProfileFromUser(u);
    setProfile(instant);
    setProfileReady(false); // won't be 'ready' until DB confirms

    // Step 2: enrich from DB in background
    fetchDBProfile(u.id).then((dbData) => {
      if (dbData) {
        setProfile(dbData);
      }
      setProfileReady(true); // DB replied — grade is now authoritative
    });
  };

  useEffect(() => {
    // On mount: restore existing session from localStorage (Supabase does this automatically)
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        applyUser(s?.user ?? null);
      })
      .catch(() => {
        // If getSession fails, just skip — user will need to log in
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen to login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        applyUser(newSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    // Clear state first so UI responds immediately
    setProfile(null);
    setSession(null);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, profileReady, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
