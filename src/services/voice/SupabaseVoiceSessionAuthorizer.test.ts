import { supabase } from '@/lib/supabase';

import { supabaseVoiceSessionAuthorizer } from './SupabaseVoiceSessionAuthorizer';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}));

describe('supabaseVoiceSessionAuthorizer', () => {
  const mockSupabase = supabase as NonNullable<typeof supabase>;
  const getSession = jest.mocked(mockSupabase.auth.getSession);
  const invoke = jest.mocked(mockSupabase.functions.invoke);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the current user session to the private-session function', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'session-token',
        } as never,
      },
      error: null,
    });
    invoke.mockResolvedValue({
      data: {
        conversationToken: 'conversation-token',
        voiceId: 'abcdefghijklmnopqrst',
        personalityMode: 'caring',
      },
      error: null,
    });

    await expect(supabaseVoiceSessionAuthorizer.authorize()).resolves.toEqual({
      conversationToken: 'conversation-token',
      voiceId: 'abcdefghijklmnopqrst',
      personalityMode: 'caring',
    });
    expect(invoke).toHaveBeenCalledWith('elevenlabs-session', {
      headers: { Authorization: 'Bearer session-token' },
    });
  });

  it('asks the user to sign in again when no session is available', async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    await expect(supabaseVoiceSessionAuthorizer.authorize()).rejects.toThrow(
      'Your sign-in session has expired. Please sign in again.',
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it('explains a rejected user session without exposing response data', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'session-token',
        } as never,
      },
      error: null,
    });
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 401 } },
    });

    await expect(supabaseVoiceSessionAuthorizer.authorize()).rejects.toThrow(
      'Your sign-in session was rejected. Please sign in again.',
    );
  });

  it('identifies an upstream ElevenLabs authorization failure', async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'session-token',
        } as never,
      },
      error: null,
    });
    invoke.mockResolvedValue({
      data: null,
      error: { context: { status: 502 } },
    });

    await expect(supabaseVoiceSessionAuthorizer.authorize()).rejects.toThrow(
      'The private voice service rejected authorization. Check the ElevenLabs agent and API key.',
    );
  });
});
