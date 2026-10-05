import { fireEvent, render, screen } from '@testing-library/react-native';
import AuthScreen from '../../../app/(auth)/sign-in';
import { supabase } from '@/lib/supabase';
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signUp: jest.fn(), signInWithPassword: jest.fn() } },
}));
jest.mock('./AuthProvider', () => ({ useAuth: () => ({ error: null }) }));
const client = supabase as NonNullable<typeof supabase>;
beforeEach(() => jest.clearAllMocks());
async function enterDetails() {
  await fireEvent.changeText(
    screen.getByLabelText('Email'),
    'person@example.test',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Password'),
    'mock-password',
  );
}
it('validates credentials before network access', async () => {
  await render(<AuthScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
  expect(screen.getByText(/Enter a valid email/)).toBeOnTheScreen();
});
it('registers and explains email confirmation', async () => {
  jest
    .mocked(client.auth.signUp)
    .mockResolvedValue({ data: { session: null, user: null }, error: null });
  await render(<AuthScreen />);
  await enterDetails();
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(client.auth.signUp).toHaveBeenCalledWith({
    email: 'person@example.test',
    password: 'mock-password',
    options: { emailRedirectTo: 'ai-companion://sign-in' },
  });
  expect(screen.getByText(/Check your email to confirm/)).toBeOnTheScreen();
});
it('handles network failure and makes retry available', async () => {
  jest
    .mocked(client.auth.signInWithPassword)
    .mockRejectedValue(new Error('network'));
  await render(<AuthScreen />);
  await enterDetails();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText(/Could not connect/)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
});
