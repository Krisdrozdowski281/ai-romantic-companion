import { assertEquals } from 'jsr:@std/assert@1';
import { createVoiceHandler, type Dependencies } from './handler.ts';
function harness() {
  const calls: string[] = [];
  const deps: Dependencies = {
    authenticate: async () => 'test-user',
    loadAccount: async () => ({
      onboarded: true,
      personalityModeId: 'playful',
      voiceId: 'voice_sarah',
    }),
    env: (name) =>
      ({
        ELEVENLABS_API_KEY: 'mock-api-key',
        ELEVENLABS_AGENT_ID: 'agent_test',
        ELEVENLABS_VOICE_SARAH: 'abcdefghijklmnopqrst',
      })[name as 'ELEVENLABS_API_KEY'],
    fetch: async (url) => {
      calls.push(url);
      return Response.json({ token: 'mock-conversation-token' });
    },
  };
  const request = () =>
    new Request('https://example.test/elevenlabs-session', { method: 'POST' });
  return { deps, calls, request };
}
for (const reason of ['missing', 'invalid', 'expired'])
  Deno.test(reason + ' authentication never calls ElevenLabs', async () => {
    const { deps, calls, request } = harness();
    deps.authenticate = async () => null;
    const response = await createVoiceHandler(deps)(request());
    assertEquals(response.status, 401);
    assertEquals(calls.length, 0);
  });
Deno.test(
  'onboarding and configured preferences gate private voice',
  async () => {
    const { deps, calls, request } = harness();
    deps.loadAccount = async () => ({
      onboarded: false,
      personalityModeId: 'caring',
      voiceId: 'voice_sarah',
    });
    assertEquals((await createVoiceHandler(deps)(request())).status, 403);
    deps.loadAccount = async () => ({
      onboarded: true,
      personalityModeId: 'injected',
      voiceId: 'voice_sarah',
    });
    assertEquals((await createVoiceHandler(deps)(request())).status, 403);
    deps.loadAccount = async () => ({
      onboarded: true,
      personalityModeId: 'caring',
      voiceId: '__proto__',
    });
    assertEquals((await createVoiceHandler(deps)(request())).status, 403);
    assertEquals(calls.length, 0);
  },
);
Deno.test(
  'success uses server preferences and agent, ignoring submitted arbitrary identifiers',
  async () => {
    const { deps, calls } = harness();
    const response = await createVoiceHandler(deps)(
      new Request('https://example.test/elevenlabs-session?agent_id=attacker', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'attacker', voiceId: 'attacker' }),
      }),
    );
    assertEquals(response.status, 200);
    assertEquals(
      calls[0],
      'https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_test',
    );
    assertEquals(await response.json(), {
      conversationToken: 'mock-conversation-token',
      voiceId: 'abcdefghijklmnopqrst',
      personalityMode: 'playful',
    });
    assertEquals(response.headers.get('cache-control'), 'no-store');
  },
);
Deno.test(
  'missing secret, malformed upstream and network failures are safe',
  async () => {
    const { deps, calls, request } = harness();
    deps.env = () => undefined;
    assertEquals((await createVoiceHandler(deps)(request())).status, 503);
    assertEquals(calls.length, 0);
    const next = harness();
    for (const upstream of [
      async () => Response.json({ secret: 'do-not-return' }, { status: 403 }),
      async () => Response.json({ token: '' }),
      async () => {
        throw new Error('secret');
      },
    ]) {
      next.deps.fetch = upstream;
      const response = await createVoiceHandler(next.deps)(next.request());
      assertEquals(response.status, 502);
      assertEquals(await response.json(), {
        error: 'Voice authorization failed.',
      });
    }
  },
);
Deno.test(
  'database errors do not expose details and methods are constrained',
  async () => {
    const { deps, request } = harness();
    deps.loadAccount = async () => {
      throw new Error('sensitive db detail');
    };
    assertEquals((await createVoiceHandler(deps)(request())).status, 503);
    assertEquals(
      (await createVoiceHandler(deps)(new Request('https://example.test')))
        .status,
      405,
    );
    assertEquals(
      (
        await createVoiceHandler(deps)(
          new Request('https://example.test', { method: 'OPTIONS' }),
        )
      ).status,
      204,
    );
  },
);
