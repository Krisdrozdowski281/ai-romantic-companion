import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';

export default function AuthScreen() {
  const { session, loading, error: configurationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (loading)
    return (
      <View style={styles.page}>
        <Text>Restoring your session…</Text>
      </View>
    );
  if (session) return <Redirect href={'/(app)' as never} />;
  const submit = async (registration: boolean) => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const result = registration
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
    setBusy(false);
    if (result.error)
      setError(
        registration
          ? 'Could not create your account. Check your details and try again.'
          : 'Invalid email or password.',
      );
    else if (registration && !result.data.session)
      setError('Check your email to confirm your account, then sign in.');
  };
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.copy}>
        Your private AI companion starts with a secure account.
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password (at least 6 characters)"
        style={styles.input}
      />
      {(configurationError || error) && (
        <Text style={styles.error}>{configurationError || error}</Text>
      )}
      <Pressable
        disabled={busy}
        style={styles.button}
        onPress={() => void submit(false)}
      >
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
      <Pressable disabled={busy} onPress={() => void submit(true)}>
        <Text style={styles.link}>Create account</Text>
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
  title: { fontSize: 32, fontWeight: '700' },
  copy: { marginVertical: 18, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#bcaeb0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  button: { backgroundColor: '#8c3150', padding: 15, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  link: { textAlign: 'center', marginTop: 18, color: '#8c3150' },
  error: { color: '#9a223d', marginBottom: 12 },
});
