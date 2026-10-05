import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase, supabaseConfigurationError } from '@/lib/supabase';
import { useVoiceService } from '@/services/voice/ElevenLabsVoiceProvider';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut(): Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState<string | null>(supabaseConfigurationError);
  const { end } = useVoiceService();
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error: restoreError }) => {
      setSession(data.session);
      setError(
        restoreError
          ? 'Could not restore your session. Please sign in again.'
          : null,
      );
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    await end();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError('Could not sign out. Please try again.');
      return;
    }
    setSession(null);
  };
  return (
    <AuthContext.Provider value={{ session, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
