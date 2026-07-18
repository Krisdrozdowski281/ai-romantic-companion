import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { ConversationView } from '@/features/conversation/ConversationView';
import { useVoiceService } from '@/services/voice/ElevenLabsVoiceProvider';

export default function ConversationScreen() {
  const { state, start, end, toggleMuted } = useVoiceService();

  useFocusEffect(
    useCallback(
      () => () => {
        void end();
      },
      [end],
    ),
  );

  return (
    <ConversationView
      state={state}
      onStart={() => void start()}
      onEnd={() => void end()}
      onToggleMuted={toggleMuted}
    />
  );
}
