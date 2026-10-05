import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

const DISCLOSURE_VERSION = '2026-07-27';
export default function Onboarding() {
  const { session, loading } = useAuth();
  const [adult, setAdult] = useState(false);
  const [disclosed, setDisclosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (loading) return null;
  if (!session) return <Redirect href={'/(auth)' as never} />;
  const complete = async () => {
    if (!adult || !disclosed || !supabase) {
      setError('Confirm both statements to continue.');
      return;
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      adult_declared_at: now,
      accepted_disclosure_version: DISCLOSURE_VERSION,
      onboarding_completed_at: now,
    });
    if (error) {
      setError('Could not save onboarding. Try again.');
      return;
    }
    router.replace('/(app)' as never);
  };
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Before we begin</Text>
      <Text style={styles.copy}>
        Luna is artificial intelligence. She is not human, conscious, physically
        present, a therapist, or an emergency service.
      </Text>
      <Pressable style={styles.choice} onPress={() => setAdult(!adult)}>
        <Text>
          {adult ? '✓' : '○'} I am an adult and understand this is a
          declaration, not age verification.
        </Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={() => setDisclosed(!disclosed)}>
        <Text>
          {disclosed ? '✓' : '○'} I understand and accept the AI disclosure.
        </Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={() => void complete()}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
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
