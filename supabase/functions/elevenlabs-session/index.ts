import { withSupabase } from 'npm:@supabase/server@1.9.0';
import { corsHeaders, createVoiceHandler } from './handler.ts';

const authenticated = withSupabase(
  { auth: 'user', audience: 'authenticated', errors: { detailed: false } },
  async (request, ctx) =>
    createVoiceHandler({
      authenticate: async () => ctx.userClaims?.id ?? null,
      loadAccount: async (userId) => {
        const [profile, preferences] = await Promise.all([
          ctx.supabase
            .from('profiles')
            .select('onboarding_completed_at')
            .eq('id', userId)
            .maybeSingle(),
          ctx.supabase
            .from('companion_preferences')
            .select('personality_mode_id,voice_id')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);
        if (profile.error || preferences.error)
          throw new Error('Account unavailable');
        if (!preferences.data) return null;
        return {
          onboarded: Boolean(profile.data?.onboarding_completed_at),
          personalityModeId: preferences.data.personality_mode_id,
          voiceId: preferences.data.voice_id,
        };
      },
      env: (name) => Deno.env.get(name),
      fetch,
    })(request),
);
export default {
  fetch: async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: corsHeaders });
    try {
      const response = await authenticated(request);
      if (response.status >= 400) {
        const status = [401, 403, 405, 502, 503].includes(response.status)
          ? response.status
          : 503;
        return Response.json(
          {
            error:
              status === 401
                ? 'Please sign in again.'
                : 'Voice authorization is unavailable. Check your account and try again.',
          },
          { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } },
        );
      }
      return response;
    } catch {
      return Response.json(
        { error: 'Voice authorization is unavailable.' },
        {
          status: 503,
          headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
        },
      );
    }
  },
};
