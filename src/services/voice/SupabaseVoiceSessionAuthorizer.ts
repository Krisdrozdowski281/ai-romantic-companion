import { supabase } from '@/lib/supabase';
import type { VoiceAuthorization } from './types';

export interface VoiceSessionAuthorizer {
  authorize(): Promise<VoiceAuthorization>;
}

function getFunctionErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('context' in error))
    return undefined;
  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== 'object' || !('status' in context))
    return undefined;
  const status = (context as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export const supabaseVoiceSessionAuthorizer: VoiceSessionAuthorizer = {
  async authorize() {
    if (!supabase)
      throw new Error('Sign in is unavailable until Supabase is configured.');

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token)
      throw new Error(
        'Your sign-in session has expired. Please sign in again.',
      );

    const { data, error, response } = await supabase.functions.invoke(
      'elevenlabs-session',
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );
    if (error) {
      const status = response?.status ?? getFunctionErrorStatus(error);
      if (status === 401)
        throw new Error(
          'Your sign-in session was rejected. Please sign in again.',
        );
      if (status === 403)
        throw new Error(
          'Complete onboarding and choose approved preferences before starting a conversation.',
        );
      if (status === 502)
        throw new Error(
          'The private voice service rejected authorization. Check the ElevenLabs agent and API key.',
        );
      if (status === 503)
        throw new Error(
          'Private voice is not configured on the server. Check the Supabase secrets.',
        );
      throw new Error('Could not authorize the private voice session.');
    }
    if (
      !data ||
      typeof data.conversationToken !== 'string' ||
      !data.conversationToken.trim() ||
      typeof data.voiceId !== 'string' ||
      !/^[a-zA-Z0-9]{20}$/.test(data.voiceId) ||
      !['caring', 'playful', 'confident'].includes(data.personalityMode)
    )
      throw new Error('Could not authorize the private voice session.');
    return {
      conversationToken: data.conversationToken,
      voiceId: data.voiceId,
      personalityMode: data.personalityMode,
    };
  },
};
