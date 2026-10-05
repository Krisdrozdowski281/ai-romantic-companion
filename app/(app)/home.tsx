import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompanion } from '@/features/companion/CompanionProvider';
import { VOICE_LABELS } from '@/features/companion/preferences';
export default function Home() {
  const { preferences } = useCompanion();
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Luna</Text>
      <Text style={styles.copy}>Your AI companion is ready when you are.</Text>
      <Text style={styles.copy}>
        {preferences.personalityModeId} · {VOICE_LABELS[preferences.voiceId]}
      </Text>
      <Link href="/conversation" asChild>
        <Pressable accessibilityRole="button" style={styles.button}>
          <Text style={styles.text}>Start private conversation</Text>
        </Pressable>
      </Link>
      <Link href="/settings">
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
