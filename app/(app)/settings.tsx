import { Link } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCompanion } from '@/features/companion/CompanionProvider';
import {
  PERSONALITY_MODES,
  VOICE_IDS,
  VOICE_LABELS,
  type Preferences,
} from '@/features/companion/preferences';
export default function Settings() {
  const { session, signOut, error: authError } = useAuth();
  const { preferences, savePreferences } = useCompanion();
  const [selection, setSelection] = useState<Preferences>(preferences);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await savePreferences(selection);
      setMessage('Preferences saved. They apply to your next conversation.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save preferences.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 28,
        justifyContent: 'center',
        backgroundColor: '#fffaf8',
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Account</Text>
      <Text>{session?.user.email}</Text>
      <Text style={{ marginVertical: 12 }}>Companion personality</Text>
      {PERSONALITY_MODES.map((value) => (
        <Pressable
          key={value}
          disabled={busy}
          accessibilityRole="radio"
          accessibilityState={{
            selected: selection.personalityModeId === value,
          }}
          onPress={() =>
            setSelection({ ...selection, personalityModeId: value })
          }
          style={{ padding: 12 }}
        >
          <Text>
            {selection.personalityModeId === value ? '✓ ' : ''}
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Text>
        </Pressable>
      ))}
      <Text style={{ marginVertical: 12 }}>Voice</Text>
      {VOICE_IDS.map((value) => (
        <Pressable
          key={value}
          disabled={busy}
          accessibilityRole="radio"
          accessibilityState={{ selected: selection.voiceId === value }}
          onPress={() => setSelection({ ...selection, voiceId: value })}
          style={{ padding: 12 }}
        >
          <Text>
            {selection.voiceId === value ? '✓ ' : ''}
            {VOICE_LABELS[value]}
          </Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void save()}
      >
        <Text style={{ color: '#8c3150', fontWeight: '700', marginTop: 20 }}>
          {busy ? 'Saving…' : 'Save preferences'}
        </Text>
      </Pressable>
      {(message || authError) && (
        <Text accessibilityLiveRegion="polite">{authError || message}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void signOut().finally(() => setBusy(false));
        }}
      >
        <Text style={{ color: '#8c3150', fontWeight: '700', marginTop: 20 }}>
          Sign out
        </Text>
      </Pressable>
      <Link href="/home">
        <Text style={{ marginTop: 24 }}>Back to companion</Text>
      </Link>
    </ScrollView>
  );
}
