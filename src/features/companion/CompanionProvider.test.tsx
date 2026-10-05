import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { CompanionProvider, useCompanion } from './CompanionProvider';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
const client = supabase as NonNullable<typeof supabase>;
const upsert = jest.fn();
const rpc = jest.mocked(client.rpc);
let profile: { onboarding_completed_at: string } | null;
let saved: { personality_mode_id: string; voice_id: string } | null;
function Probe() {
  const {
    loading,
    error,
    preferences,
    completeOnboarding,
    savePreferences,
    onboarded,
  } = useCompanion();
  return (
    <>
      <Text>{loading ? 'Loading' : onboarded ? 'Ready' : 'Onboard'}</Text>
      <Text>{preferences.personalityModeId + ' ' + preferences.voiceId}</Text>
      {error && <Text>{error}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => void completeOnboarding(false, true).catch(() => {})}
      >
        <Text>Invalid consent</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void completeOnboarding(true, true)}
      >
        <Text>Consent</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          void savePreferences({
            personalityModeId: 'confident',
            voiceId: 'voice_charlotte',
          })
        }
      >
        <Text>Save</Text>
      </Pressable>
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  profile = { onboarding_completed_at: '2026-07-27' };
  saved = { personality_mode_id: 'playful', voice_id: 'voice_sarah' };
  jest
    .mocked(useAuth)
    .mockReturnValue({ session: { user: { id: 'test-user' } } } as never);
  upsert.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({ data: null, error: null } as never);
  jest.mocked(client.from).mockImplementation(
    (table) =>
      ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: table === 'profiles' ? profile : saved,
              error: null,
            }),
          }),
        }),
        upsert,
      }) as never,
  );
});
it('reloads persisted preferences and writes only the signed-in user selection', async () => {
  await render(
    <CompanionProvider>
      <Probe />
    </CompanionProvider>,
  );
  await screen.findByText('Ready');
  expect(screen.getByText('playful voice_sarah')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(upsert).toHaveBeenCalledWith({
    user_id: 'test-user',
    personality_mode_id: 'confident',
    voice_id: 'voice_charlotte',
  });
  expect(screen.getByText('confident voice_charlotte')).toBeOnTheScreen();
});
it('requires affirmative consent and uses the atomic server onboarding function', async () => {
  profile = null;
  saved = null;
  await render(
    <CompanionProvider>
      <Probe />
    </CompanionProvider>,
  );
  await screen.findByText('Onboard');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Invalid consent' }),
  );
  expect(rpc).not.toHaveBeenCalled();
  profile = { onboarding_completed_at: '2026-07-27' };
  await fireEvent.press(screen.getByRole('button', { name: 'Consent' }));
  expect(rpc).toHaveBeenCalledWith('complete_onboarding', {
    adult_accepted: true,
    disclosure_accepted: true,
  });
  expect(await screen.findByText('Ready')).toBeOnTheScreen();
});
it('treats database failures as retryable errors, not incomplete onboarding', async () => {
  jest.mocked(client.from).mockImplementation(
    () =>
      ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: 'sensitive' },
            }),
          }),
        }),
      }) as never,
  );
  await render(
    <CompanionProvider>
      <Probe />
    </CompanionProvider>,
  );
  expect(
    await screen.findByText(/Could not load your account/),
  ).toBeOnTheScreen();
});
