export interface VoiceAccount {
  onboarded: boolean;
  personalityModeId: string;
  voiceId: string;
}
export interface Dependencies {
  authenticate(): Promise<string | null>;
  loadAccount(userId: string): Promise<VoiceAccount | null>;
  env(name: string): string | undefined;
  fetch(input: string, init: RequestInit): Promise<Response>;
}
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
const modes = ['caring', 'playful', 'confident'];
const voiceSecrets: Record<string, string> = {
  voice_hope: 'ELEVENLABS_VOICE_HOPE',
  voice_sarah: 'ELEVENLABS_VOICE_SARAH',
  voice_charlotte: 'ELEVENLABS_VOICE_CHARLOTTE',
};
export function createVoiceHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST')
      return json({ error: 'Method not allowed.' }, 405);
    try {
      const userId = await deps.authenticate();
      if (!userId) return json({ error: 'Please sign in again.' }, 401);
      const account = await deps.loadAccount(userId);
      if (!account?.onboarded)
        return json(
          { error: 'Complete onboarding before starting a conversation.' },
          403,
        );
      const secretName = Object.hasOwn(voiceSecrets, account.voiceId)
        ? voiceSecrets[account.voiceId]
        : undefined;
      if (!modes.includes(account.personalityModeId) || !secretName)
        return json({ error: 'Choose approved companion preferences.' }, 403);
      const apiKey = deps.env('ELEVENLABS_API_KEY')?.trim();
      const agentId = deps.env('ELEVENLABS_AGENT_ID')?.trim();
      const voiceId = deps.env(secretName)?.trim();
      if (!apiKey || !agentId || !voiceId || !/^[a-zA-Z0-9]{20}$/.test(voiceId))
        return json({ error: 'Voice service is unavailable.' }, 503);
      try {
        const response = await deps.fetch(
          'https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=' +
            encodeURIComponent(agentId),
          {
            method: 'GET',
            headers: { 'xi-api-key': apiKey },
            signal: AbortSignal.timeout(10000),
          },
        );
        if (!response.ok)
          return json({ error: 'Voice authorization failed.' }, 502);
        const body: unknown = await response.json();
        if (
          !body ||
          typeof body !== 'object' ||
          !('token' in body) ||
          typeof body.token !== 'string' ||
          !body.token.trim()
        )
          return json({ error: 'Voice authorization failed.' }, 502);
        return json({
          conversationToken: body.token,
          voiceId,
          personalityMode: account.personalityModeId,
        });
      } catch {
        return json({ error: 'Voice authorization failed.' }, 502);
      }
    } catch {
      return json({ error: 'Could not authorize the voice session.' }, 503);
    }
  };
}
