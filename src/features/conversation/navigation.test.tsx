import { render } from '@testing-library/react-native';
import ConversationScreen from '../../../app/(app)/conversation';
import { useVoiceService } from '@/services/voice/ElevenLabsVoiceProvider';
jest.mock('@/services/voice/ElevenLabsVoiceProvider', () => ({
  useVoiceService: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) =>
    jest.requireActual('react').useEffect(effect, [effect]),
}));
it('ends the active session on navigation or screen unmount', async () => {
  const end = jest.fn().mockResolvedValue(undefined);
  jest.mocked(useVoiceService).mockReturnValue({
    state: {
      connection: 'connected',
      mode: 'listening',
      muted: false,
      error: null,
    },
    start: jest.fn(),
    toggleMuted: jest.fn(),
    end,
  });
  const view = await render(<ConversationScreen />);
  await view.unmount();
  expect(end).toHaveBeenCalledTimes(1);
});
