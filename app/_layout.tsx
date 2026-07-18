import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ElevenLabsVoiceProvider } from '@/services/voice/ElevenLabsVoiceProvider';

export default function RootLayout() {
  return (
    <ElevenLabsVoiceProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Welcome' }} />
        <Stack.Screen name="conversation" options={{ title: 'Conversation' }} />
      </Stack>
    </ElevenLabsVoiceProvider>
  );
}
