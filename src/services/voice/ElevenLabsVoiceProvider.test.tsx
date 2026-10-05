import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import {
  ElevenLabsVoiceProvider,
  useVoiceService,
} from './ElevenLabsVoiceProvider';
import { supabaseVoiceSessionAuthorizer } from './SupabaseVoiceSessionAuthorizer';
const mockStart = jest.fn().mockResolvedValue('mock-id');
const mockEnd = jest.fn().mockResolvedValue(undefined);
const mockControls = { startSession: mockStart, endSession: mockEnd };
const mockMuted = { isMuted: false, setMuted: jest.fn() };
jest.mock('@elevenlabs/react-native', () => ({
  ConversationProvider: ({ children }: { children: unknown }) => children,
  useConversationControls: () => mockControls,
  useConversationInput: () => mockMuted,
  useConversationMode: () => ({ mode: 'listening' }),
  useConversationStatus: () => ({ status: 'disconnected' }),
}));
jest.mock('./ExpoMicrophonePermissionGateway', () => ({
  expoMicrophonePermissionGateway: { requestPermission: async () => 'granted' },
}));
jest.mock('./SupabaseVoiceSessionAuthorizer', () => ({
  supabaseVoiceSessionAuthorizer: { authorize: jest.fn() },
}));
function Probe() {
  const { start } = useVoiceService();
  return (
    <Pressable accessibilityRole="button" onPress={() => void start()}>
      <Text>Start</Text>
    </Pressable>
  );
}
it('applies server-approved voice and personality through the SDK and cleans up on unmount', async () => {
  jest.mocked(supabaseVoiceSessionAuthorizer.authorize).mockResolvedValue({
    conversationToken: 'mock-token',
    voiceId: 'abcdefghijklmnopqrst',
    personalityMode: 'playful',
  });
  const view = await render(
    <ElevenLabsVoiceProvider>
      <Probe />
    </ElevenLabsVoiceProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
  expect(mockStart).toHaveBeenCalledWith({
    conversationToken: 'mock-token',
    overrides: { tts: { voiceId: 'abcdefghijklmnopqrst' } },
    dynamicVariables: { personality_mode: 'playful' },
  });
  await view.unmount();
  expect(mockEnd).toHaveBeenCalled();
});
