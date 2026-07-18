import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your AI companion</Text>
      <Text style={styles.body}>
        A simple adult-only voice prototype. Your companion is artificial
        intelligence, not a human, therapist, or emergency service.
      </Text>
      <Link href="/conversation" asChild>
        <Pressable accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>Continue to voice test</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#fffaf8',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2b2020',
    marginBottom: 18,
  },
  body: { fontSize: 17, lineHeight: 25, color: '#564747', marginBottom: 30 },
  button: { padding: 16, borderRadius: 10, backgroundColor: '#8c3150' },
  buttonText: { color: '#ffffff', textAlign: 'center', fontWeight: '700' },
});
