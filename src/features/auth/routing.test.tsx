import { render, screen } from '@testing-library/react-native';
import { ProtectedRoutes } from '../../../app/_layout';
import ApplicationLayout from '../../../app/(app)/_layout';
import { useAuth } from './AuthProvider';
import { useCompanion } from '@/features/companion/CompanionProvider';
jest.mock('./AuthProvider', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('@/features/companion/CompanionProvider', () => ({
  useCompanion: jest.fn(),
  CompanionProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('@/services/voice/ElevenLabsVoiceProvider', () => ({
  ElevenLabsVoiceProvider: ({ children }: { children: unknown }) => children,
}));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  const Stack = ({ children }: { children: unknown }) => children;
  Stack.Screen = function Screen({ name }: { name: string }) {
    return <Text>{name}</Text>;
  };
  Stack.Protected = function Protected({
    guard,
    children,
  }: {
    guard: boolean;
    children: unknown;
  }) {
    return guard ? children : null;
  };
  return { Stack };
});
it('does not render protected routes until authentication is restored', async () => {
  jest
    .mocked(useAuth)
    .mockReturnValue({ loading: true, session: null } as never);
  await render(<ProtectedRoutes />);
  expect(screen.queryByText('(app)')).toBeNull();
});
it.each([false, true])(
  'protects the application area for authenticated=%s',
  async (authenticated) => {
    jest.mocked(useAuth).mockReturnValue({
      loading: false,
      session: authenticated ? { user: { id: 'test-user' } } : null,
    } as never);
    await render(<ProtectedRoutes />);
    expect(Boolean(screen.queryByText('(app)'))).toBe(authenticated);
    expect(Boolean(screen.queryByText('(auth)'))).toBe(!authenticated);
  },
);
it.each([false, true])(
  'requires onboarding before home, settings and conversation: %s',
  async (onboarded) => {
    jest.mocked(useAuth).mockReturnValue({ signOut: jest.fn() } as never);
    jest
      .mocked(useCompanion)
      .mockReturnValue({ loading: false, error: null, onboarded } as never);
    await render(<ApplicationLayout />);
    for (const route of ['home', 'settings', 'conversation'])
      expect(Boolean(screen.queryByText(route))).toBe(onboarded);
    expect(Boolean(screen.queryByText('onboarding'))).toBe(!onboarded);
  },
);
