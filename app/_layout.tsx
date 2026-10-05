import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ElevenLabsVoiceProvider } from '@/services/voice/ElevenLabsVoiceProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';

export default function RootLayout() {
  return (
    <ElevenLabsVoiceProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ElevenLabsVoiceProvider>
  );
}
