import { Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCompanion } from '@/features/companion/CompanionProvider';
import { useAuth } from '@/features/auth/AuthProvider';
export default function ApplicationLayout() {
  const { loading, error, onboarded, reload } = useCompanion();
  const { signOut, error: authError } = useAuth();
  if (loading)
    return (
      <View style={{ padding: 28 }}>
        <Text>Loading your account…</Text>
      </View>
    );
  if (error)
    return (
      <View style={{ padding: 28 }}>
        <Text accessibilityRole="alert">{error}</Text>
        <Pressable accessibilityRole="button" onPress={reload}>
          <Text>Try again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void signOut()}>
          <Text>Sign out</Text>
        </Pressable>
        {authError && <Text>{authError}</Text>}
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="home" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="conversation" />
      </Stack.Protected>
    </Stack>
  );
}
