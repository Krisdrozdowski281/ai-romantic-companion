import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
export default function AuthScreen() {
  const { error: configurationError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (registration: boolean) => {
    if (!supabase || busy) return;
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 6
    ) {
      setMessage(
        'Enter a valid email and a password of at least 6 characters.',
      );
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = registration
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: 'ai-companion://sign-in' },
          })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (result.error) {
        if (result.error.code === 'email_not_confirmed')
          setMessage('Confirm your email before signing in.');
        else if (
          result.error.status === 0 ||
          result.error.name === 'AuthRetryableFetchError'
        )
          setMessage('Could not connect. Check your network and try again.');
        else
          setMessage(
            registration
              ? 'Could not create your account. Check your details and try again.'
              : 'Could not sign in. Check your email and password and try again.',
          );
      } else if (registration && !result.data.session)
        setMessage('Check your email to confirm your account, then sign in.');
    } catch {
      setMessage('Could not connect. Check your network and try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}
    >
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.copy}>
        Your private AI companion starts with a secure account.
      </Text>
      <TextInput
        accessibilityLabel="Email"
        value={email}
        onChangeText={setEmail}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Password"
        value={password}
        onChangeText={setPassword}
        editable={!busy}
        secureTextEntry
        placeholder="Password (at least 6 characters)"
        style={styles.input}
      />
      {(configurationError || message) && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {configurationError || message}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy || !supabase}
        style={styles.button}
        onPress={() => void submit(false)}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Please wait…' : 'Sign in'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy || !supabase}
        onPress={() => void submit(true)}
      >
        <Text style={styles.link}>Create account</Text>
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
