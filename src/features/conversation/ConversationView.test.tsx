import { fireEvent, render, screen } from '@testing-library/react-native';

import type { VoiceState } from '@/services/voice/types';

import { ConversationView } from './ConversationView';

const actions = {
  onStart: jest.fn(),
  onEnd: jest.fn(),
  onToggleMuted: jest.fn(),
};

function renderState(overrides: Partial<VoiceState> = {}) {
  const state: VoiceState = {
    connection: 'idle',
    mode: 'idle',
    muted: false,
    error: null,
    ...overrides,
  };
  return render(<ConversationView state={state} {...actions} />);
}

describe('ConversationView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders idle controls', async () => {
    await renderState();
    expect(screen.getByText('Ready')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Start conversation' }),
    );
    expect(actions.onStart).toHaveBeenCalledTimes(1);
  });

  it('renders connecting with disabled start', async () => {
    await renderState({ connection: 'connecting' });
    expect(screen.getByText('Connecting…')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Start conversation' }),
    ).toBeDisabled();
  });

  it('renders connected listening state and end control', async () => {
    await renderState({ connection: 'connected', mode: 'listening' });
    expect(screen.getByText('● Listening')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'End conversation' }),
    );
    expect(actions.onEnd).toHaveBeenCalledTimes(1);
  });

  it('renders muted state', async () => {
    await renderState({
      connection: 'connected',
      mode: 'speaking',
      muted: true,
    });
    expect(screen.getByText('● Speaking')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Unmute microphone' }),
    );
    expect(actions.onToggleMuted).toHaveBeenCalledTimes(1);
  });

  it('renders a clear permission error', async () => {
    await renderState({
      connection: 'error',
      error: {
        code: 'microphone-permission',
        message: 'Allow microphone access in Android Settings, then try again.',
      },
    });
    expect(
      screen.getByText('Microphone permission required'),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Android Settings/)).toBeOnTheScreen();
  });
});
