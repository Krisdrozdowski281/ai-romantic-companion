import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_PREFERENCES,
  isPreferenceSelection,
  type Preferences,
} from './preferences';

interface CompanionState {
  revision: number;
  userId: string | null;
  loading: boolean;
  error: string | null;
  onboarded: boolean;
  preferences: Preferences;
}
interface CompanionContextValue extends CompanionState {
  reload(): void;
  completeOnboarding(adult: boolean, disclosure: boolean): Promise<void>;
  savePreferences(preferences: Preferences): Promise<void>;
}
const initial: CompanionState = {
  revision: -1,
  userId: null,
  loading: false,
  error: null,
  onboarded: false,
  preferences: DEFAULT_PREFERENCES,
};
const Context = createContext<CompanionContextValue | null>(null);
export function CompanionProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [state, setState] = useState(initial);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    if (!userId || !supabase) return;
    void Promise.all([
      supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('companion_preferences')
        .select('personality_mode_id,voice_id')
        .eq('user_id', userId)
        .maybeSingle(),
    ])
      .then(([profile, preferences]) => {
        if (profile.error || preferences.error) throw new Error('load');
        const selection = preferences.data
          ? {
              personalityModeId: preferences.data.personality_mode_id,
              voiceId: preferences.data.voice_id,
            }
          : DEFAULT_PREFERENCES;
        if (!isPreferenceSelection(selection)) throw new Error('invalid');
        if (active)
          setState({
            userId,
            revision,
            loading: false,
            error: null,
            onboarded: Boolean(profile.data?.onboarding_completed_at),
            preferences: selection,
          });
      })
      .catch(() => {
        if (active)
          setState({
            ...initial,
            revision,
            userId,
            error:
              'Could not load your account. Check your connection and try again.',
          });
      });
    return () => {
      active = false;
    };
  }, [userId, revision]);
  const completeOnboarding = async (adult: boolean, disclosure: boolean) => {
    if (!adult || !disclosure)
      throw new Error('Confirm both statements to continue.');
    if (!supabase || !userId) throw new Error('Please sign in again.');
    const { error } = await supabase.rpc('complete_onboarding', {
      adult_accepted: adult,
      disclosure_accepted: disclosure,
    });
    if (error)
      throw new Error(
        'Could not save onboarding. Check your connection and try again.',
      );
    reload();
  };
  const savePreferences = async (preferences: Preferences) => {
    if (
      !supabase ||
      !userId ||
      !state.onboarded ||
      !isPreferenceSelection(preferences)
    )
      throw new Error('Choose an approved personality and voice.');
    const { error } = await supabase.from('companion_preferences').upsert({
      user_id: userId,
      personality_mode_id: preferences.personalityModeId,
      voice_id: preferences.voiceId,
    });
    if (error)
      throw new Error(
        'Could not save preferences. Check your connection and try again.',
      );
    setState((current) =>
      current.userId === userId ? { ...current, preferences } : current,
    );
  };
  const visible =
    userId === state.userId && revision === state.revision
      ? state
      : { ...initial, userId, loading: Boolean(userId) };
  return (
    <Context.Provider
      value={{ ...visible, reload, completeOnboarding, savePreferences }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCompanion() {
  const value = useContext(Context);
  if (!value)
    throw new Error('useCompanion must be used inside CompanionProvider.');
  return value;
}
