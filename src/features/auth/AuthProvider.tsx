import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
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
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(supabaseConfigurationError);
  const { end } = useVoiceService();
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;
    let authChanged = false;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      if (_event === 'INITIAL_SESSION' && authChanged) return;
      if (_event !== 'INITIAL_SESSION') authChanged = true;
      setSession(nextSession);
      setLoading(false);
      if (!nextSession) void end();
    });
    void client.auth
      .getSession()
      .then(({ data, error: restoreError }) => {
        if (!active || authChanged) return;
        setSession(restoreError ? null : data.session);
        setError(
          restoreError
            ? 'Could not restore your session. Please sign in again.'
            : null,
        );
        setLoading(false);
      })
      .catch(() => {
        if (!active || authChanged) return;
        setSession(null);
        setLoading(false);
        setError(
          'Could not restore your session. Check your connection and sign in again.',
        );
      });
    const refresh = (state: string) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    if (Platform.OS !== 'web') refresh(AppState.currentState);
    const appState =
      Platform.OS !== 'web'
        ? AppState.addEventListener('change', refresh)
        : null;
    return () => {
      active = false;
      subscription.unsubscribe();
      appState?.remove();
      if (Platform.OS !== 'web') client.auth.stopAutoRefresh();
    };
  }, [end]);
  const signOut = async () => {
    await end();
    if (!supabase) return;
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSession(null);
    } catch {
      setError('Could not sign out. Check your connection and try again.');
    }
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
