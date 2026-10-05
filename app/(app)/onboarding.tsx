import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useCompanion } from '@/features/companion/CompanionProvider';
import { useAuth } from '@/features/auth/AuthProvider';
export default function Onboarding() {
  const { completeOnboarding } = useCompanion();
  const { signOut, error: authError } = useAuth();
  const [adult, setAdult] = useState(false);
  const [disclosed, setDisclosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const complete = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding(adult, disclosed);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save onboarding. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Before we begin</Text>
      <Text style={styles.copy}>
        Luna is artificial intelligence. She is not human, conscious, physically
        present, a therapist, or an emergency service.
      </Text>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="I am 18 or older"
        accessibilityState={{ checked: adult, disabled: busy }}
        disabled={busy}
        style={styles.choice}
        onPress={() => setAdult(!adult)}
      >
        <Text>
          {adult ? '✓' : '○'} I am 18 or older. This is my age declaration, not
          identity or age verification.
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="I accept the AI disclosure"
        accessibilityState={{ checked: disclosed, disabled: busy }}
        disabled={busy}
        style={styles.choice}
        onPress={() => setDisclosed(!disclosed)}
      >
        <Text>
          {disclosed ? '✓' : '○'} I understand and accept the AI disclosure.
        </Text>
      </Pressable>
      {(error || authError) && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error || authError}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        style={styles.button}
        onPress={() => void complete()}
      >
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Continue'}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void signOut()}
      >
        <Text style={styles.copy}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fffaf8',
  },
  title: { fontSize: 30, fontWeight: '700' },
  copy: { fontSize: 16, lineHeight: 24, marginVertical: 20 },
  choice: {
    borderWidth: 1,
    borderColor: '#bcaeb0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  button: { backgroundColor: '#8c3150', borderRadius: 8, padding: 15 },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  error: { color: '#9a223d', marginBottom: 12 },
});
