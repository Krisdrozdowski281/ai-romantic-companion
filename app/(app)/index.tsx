import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
export default function Home() {
  const { session, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => {
    if (!supabase || !session) return;
    supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setOnboarded(Boolean(data?.onboarding_completed_at)));
  }, [session]);
  if (loading || onboarded === null) return null;
  if (!session) return <Redirect href={'/(auth)' as never} />;
  if (!onboarded) return <Redirect href={'/(app)/onboarding' as never} />;
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Luna</Text>
      <Text style={styles.copy}>Your AI companion is ready when you are.</Text>
      <Link href="/conversation" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.text}>Start private conversation</Text>
        </Pressable>
      </Link>
      <Link href={'/(app)/settings' as never}>
        <Text style={styles.link}>Settings and preferences</Text>
      </Link>
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
  copy: { fontSize: 17, marginVertical: 18 },
  button: { padding: 16, borderRadius: 10, backgroundColor: '#8c3150' },
  text: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  link: { marginTop: 24, color: '#8c3150', textAlign: 'center' },
});
