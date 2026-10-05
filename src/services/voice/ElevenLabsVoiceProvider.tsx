import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react-native';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { expoMicrophonePermissionGateway } from './ExpoMicrophonePermissionGateway';
import { supabaseVoiceSessionAuthorizer } from './SupabaseVoiceSessionAuthorizer';
import { VoiceService } from './VoiceService';
import type { VoiceState } from './types';

interface VoiceContextValue {
  state: VoiceState;
  start(): Promise<void>;
  end(): Promise<void>;
  toggleMuted(): void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function ElevenLabsVoiceProvider({ children }: PropsWithChildren) {
  const [service] = useState(() => {
    return new VoiceService({
      permissionGateway: expoMicrophonePermissionGateway,
      sessionAuthorizer: supabaseVoiceSessionAuthorizer,
    });
  });
  const state = useSyncExternalStore(
    service.subscribe,
    service.getSnapshot,
    service.getSnapshot,
  );

  useEffect(
    () => () => {
      void service.dispose();
    },
    [service],
  );

  const actions = useMemo(
    () => ({
      start: () => service.start(),
      end: () => service.end(),
      toggleMuted: () => service.toggleMuted(),
    }),
    [service],
  );
  const value = useMemo<VoiceContextValue>(
    () => ({ state, ...actions }),
    [actions, state],
  );

  return (
    <VoiceContext.Provider value={value}>
      <ConversationProvider>
        <ElevenLabsBridge service={service} />
        {children}
      </ConversationProvider>
    </VoiceContext.Provider>
  );
}

function ElevenLabsBridge({ service }: { service: VoiceService }) {
  const controls = useConversationControls();
  const { status, message } = useConversationStatus();
  const { mode } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();

  useEffect(() => {
    service.bindAdapter({
      startSession: ({ conversationToken, voiceId, personalityMode }) =>
        controls.startSession({
          conversationToken,
          overrides: { tts: { voiceId } },
          dynamicVariables: { personality_mode: personalityMode },
        }),
      endSession: controls.endSession,
      setMuted,
    });
  }, [controls, service, setMuted]);

  useEffect(() => {
    service.handleProviderStatus(status, message);
  }, [message, service, status]);

  useEffect(() => {
    service.handleProviderMode(mode);
  }, [mode, service]);

  useEffect(() => {
    service.handleProviderMuted(isMuted);
  }, [isMuted, service]);

  return null;
}

export function useVoiceService(): VoiceContextValue {
  const value = useContext(VoiceContext);
  if (!value)
    throw new Error(
      'useVoiceService must be used inside ElevenLabsVoiceProvider.',
    );
  return value;
}
