import { withSupabase } from 'npm:@supabase/server';

const json = (body: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getUpstreamErrorCode = async (response: Response) => {
  try {
    const body: unknown = await response.clone().json();
    if (!body || typeof body !== 'object') return undefined;

    const detail = (body as { detail?: unknown }).detail;
    if (detail && typeof detail === 'object') {
      const status = (detail as { status?: unknown }).status;
      if (typeof status === 'string') return status;
    }

    const status = (body as { status?: unknown }).status;
    return typeof status === 'string' ? status : undefined;
  } catch {
    return undefined;
  }
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (_request, ctx) => {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')?.trim();
    const agentId = Deno.env.get('ELEVENLABS_AGENT_ID')?.trim();
    if (!apiKey || !agentId)
      return json({ error: 'Voice service is unavailable.' }, 503);
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}&participant_name=${encodeURIComponent(ctx.userClaims.sub)}`,
      { method: 'GET', headers: { 'xi-api-key': apiKey } },
    );
    if (!response.ok) {
      const upstreamCode = await getUpstreamErrorCode(response);
      console.error('ElevenLabs conversation-token request rejected', {
        status: response.status,
        upstreamCode,
      });
      return json({ error: 'Voice authorization failed.' }, 502);
    }
    const body: unknown = await response.json();
    if (
      !body ||
      typeof body !== 'object' ||
      typeof (body as { token?: unknown }).token !== 'string'
    )
      return json({ error: 'Voice authorization failed.' }, 502);
    return json({ conversationToken: (body as { token: string }).token });
  }),
};
