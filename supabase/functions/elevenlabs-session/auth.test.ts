import { assertEquals } from 'jsr:@std/assert@1';
import { SignJWT } from 'npm:jose@6.2.12';
import endpoint from './index.ts';
Deno.test(
  'real wrapper rejects missing, invalid, expired and forged JWTs; valid users get scoped access',
  async () => {
    const names = [
      'SUPABASE_URL',
      'SUPABASE_PUBLISHABLE_KEYS',
      'SUPABASE_JWKS',
      'ELEVENLABS_API_KEY',
      'ELEVENLABS_AGENT_ID',
      'ELEVENLABS_VOICE_SARAH',
    ];
    const previous = new Map(names.map((name) => [name, Deno.env.get(name)]));
    const originalFetch = globalThis.fetch;
    const key = crypto.getRandomValues(new Uint8Array(32));
    const encoded = btoa(String.fromCharCode(...key))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    let providerCalls = 0,
      dbCalls = 0;
    try {
      Deno.env.set('SUPABASE_URL', 'https://supabase.example.test');
      Deno.env.set(
        'SUPABASE_PUBLISHABLE_KEYS',
        JSON.stringify({ default: 'sb_publishable_mock' }),
      );
      Deno.env.set(
        'SUPABASE_JWKS',
        JSON.stringify({
          keys: [{ kty: 'oct', k: encoded, kid: 'test-key', alg: 'HS256' }],
        }),
      );
      Deno.env.set('ELEVENLABS_API_KEY', 'mock-key');
      Deno.env.set('ELEVENLABS_AGENT_ID', 'agent_test');
      Deno.env.set('ELEVENLABS_VOICE_SARAH', 'abcdefghijklmnopqrst');
      globalThis.fetch = async (input) => {
        const url = String(input);
        if (url.startsWith('https://api.elevenlabs.io/')) {
          providerCalls++;
          return Response.json({ token: 'mock-token' });
        }
        if (url.startsWith('https://supabase.example.test/rest/v1/profiles')) {
          dbCalls++;
          return Response.json([{ onboarding_completed_at: '2026-07-27' }]);
        }
        if (
          url.startsWith(
            'https://supabase.example.test/rest/v1/companion_preferences',
          )
        ) {
          dbCalls++;
          return Response.json([
            { personality_mode_id: 'caring', voice_id: 'voice_sarah' },
          ]);
        }
        throw new Error(
          'Unexpected network request; real services are forbidden in tests.',
        );
      };
      const sign = (seconds: number, signingKey = key) =>
        new SignJWT({ sub: 'test-user', role: 'authenticated' })
          .setProtectedHeader({ alg: 'HS256', kid: 'test-key' })
          .setAudience('authenticated')
          .setExpirationTime(Math.floor(Date.now() / 1000) + seconds)
          .sign(signingKey);
      const request = (token?: string) =>
        new Request('https://example.test/elevenlabs-session', {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer ' + token } : {},
        });
      for (const token of [
        undefined,
        'invalid',
        await sign(-60),
        await sign(120, crypto.getRandomValues(new Uint8Array(32))),
      ]) {
        const response = await endpoint.fetch(request(token));
        assertEquals(response.status, 401);
        assertEquals(await response.json(), { error: 'Please sign in again.' });
      }
      assertEquals(providerCalls, 0);
      assertEquals(dbCalls, 0);
      const response = await endpoint.fetch(request(await sign(120)));
      assertEquals(response.status, 200);
      assertEquals(await response.json(), {
        conversationToken: 'mock-token',
        voiceId: 'abcdefghijklmnopqrst',
        personalityMode: 'caring',
      });
      assertEquals(providerCalls, 1);
      assertEquals(dbCalls, 2);
    } finally {
      globalThis.fetch = originalFetch;
      for (const name of names) {
        const value = previous.get(name);
        if (value === undefined) Deno.env.delete(name);
        else Deno.env.set(name, value);
      }
    }
  },
);
