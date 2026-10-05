import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { ElevenLabsVoiceProvider } from '@/services/voice/ElevenLabsVoiceProvider';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { CompanionProvider } from '@/features/companion/CompanionProvider';
export default function RootLayout() {
  return (
    <ElevenLabsVoiceProvider>
      <AuthProvider>
        <CompanionProvider>
          <StatusBar style="dark" />
          <ProtectedRoutes />
        </CompanionProvider>
      </AuthProvider>
    </ElevenLabsVoiceProvider>
  );
}
export function ProtectedRoutes() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <View>
        <Text>Restoring your session…</Text>
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
