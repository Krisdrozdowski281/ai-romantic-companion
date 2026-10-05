import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { Pressable, Text } from 'react-native';
import { AuthProvider, useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { useVoiceService } from '@/services/voice/ElevenLabsVoiceProvider';
jest.mock('@/lib/supabase', () => ({
  supabaseConfigurationError: null,
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));
jest.mock('@/services/voice/ElevenLabsVoiceProvider', () => ({
  useVoiceService: jest.fn(),
}));
const client = supabase as NonNullable<typeof supabase>;
const restored = { user: { id: 'test-user' } } as Session;
let change: (event: string, session: Session | null) => void;
const end = jest.fn();
const unsubscribe = jest.fn();
function Probe() {
  const { session, loading, error, signOut } = useAuth();
  return (
    <>
      <Text>{loading ? 'Loading' : session ? 'Signed in' : 'Signed out'}</Text>
      {error && <Text>{error}</Text>}
      <Pressable accessibilityRole="button" onPress={() => void signOut()}>
        <Text>Logout</Text>
      </Pressable>
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useVoiceService).mockReturnValue({ end } as never);
  end.mockResolvedValue(undefined);
  jest.mocked(client.auth.onAuthStateChange).mockImplementation((callback) => {
    change = callback as typeof change;
    return { data: { subscription: { unsubscribe } } } as never;
  });
  jest
    .mocked(client.auth.getSession)
    .mockResolvedValue({ data: { session: restored }, error: null });
  jest.mocked(client.auth.signOut).mockResolvedValue({ error: null });
});
it('shows initial loading and restores the persisted session', async () => {
  let finish: (
    value: Awaited<ReturnType<typeof client.auth.getSession>>,
  ) => void = () => {};
  jest.mocked(client.auth.getSession).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  expect(screen.getByText('Loading')).toBeOnTheScreen();
  await act(async () => finish({ data: { session: restored }, error: null }));
  expect(screen.getByText('Signed in')).toBeOnTheScreen();
});
it('handles failed restoration without leaving the loading screen', async () => {
  jest.mocked(client.auth.getSession).mockRejectedValue(new Error('network'));
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  expect(await screen.findByText('Signed out')).toBeOnTheScreen();
  expect(screen.getByText(/Could not restore/)).toBeOnTheScreen();
});
it('handles anonymous and expired sessions and ends active voice', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await screen.findByText('Signed in');
  await act(async () => change('SIGNED_OUT', null));
  expect(screen.getByText('Signed out')).toBeOnTheScreen();
  expect(end).toHaveBeenCalled();
});
it('ends voice before logout and reports logout errors', async () => {
  jest.mocked(client.auth.signOut).mockRejectedValue(new Error('network'));
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await screen.findByText('Signed in');
  await fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  expect(screen.getByText(/Could not sign out/)).toBeOnTheScreen();
  expect(screen.getByText('Signed in')).toBeOnTheScreen();
  expect(end.mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(client.auth.signOut).mock.invocationCallOrder[0]!,
  );
  jest.mocked(client.auth.signOut).mockResolvedValue({ error: null });
  await fireEvent.press(screen.getByRole('button', { name: 'Logout' }));
  expect(screen.getByText('Signed out')).toBeOnTheScreen();
});
it('does not replace a newer auth event with stale restoration', async () => {
  let finish: (
    value: Awaited<ReturnType<typeof client.auth.getSession>>,
  ) => void = () => {};
  jest.mocked(client.auth.getSession).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const view = await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await act(async () => change('SIGNED_IN', restored));
  await act(async () => finish({ data: { session: null }, error: null }));
  expect(screen.getByText('Signed in')).toBeOnTheScreen();
  await view.unmount();
  expect(unsubscribe).toHaveBeenCalled();
});

it('keeps restoration errors visible after the initial anonymous event', async () => {
  let fail: (reason: Error) => void = () => {};
  jest.mocked(client.auth.getSession).mockReturnValue(
    new Promise((_resolve, reject) => {
      fail = reject;
    }),
  );
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await act(async () => change('INITIAL_SESSION', null));
  await act(async () => fail(new Error('network')));
  expect(screen.getByText(/Could not restore/)).toBeOnTheScreen();
});
it('ignores a stale initial callback after a newer sign-in', async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await screen.findByText('Signed in');
  await act(async () => change('SIGNED_IN', restored));
  await act(async () => change('INITIAL_SESSION', null));
  expect(screen.getByText('Signed in')).toBeOnTheScreen();
});
