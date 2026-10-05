export interface AppEnvironment {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export type EnvironmentResult =
  { success: true; value: AppEnvironment } | { success: false; error: string };

export function validateEnvironment(environment: {
  EXPO_PUBLIC_SUPABASE_URL?: string | undefined;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
}): EnvironmentResult {
  const url = environment.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    return {
      success: false,
      error:
        'Supabase configuration is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart Expo.',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      success: false,
      error: 'Supabase URL is invalid. Use an HTTPS project URL.',
    };
  }
  const loopback = ['localhost', '127.0.0.1', '10.0.2.2'].includes(
    parsedUrl.hostname,
  );
  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash ||
    (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '')
  )
    return {
      success: false,
      error:
        'Use the Supabase project URL without credentials, paths, or query parameters.',
    };
  if (
    parsedUrl.protocol !== 'https:' &&
    !(parsedUrl.protocol === 'http:' && loopback)
  )
    return { success: false, error: 'Supabase URL must use HTTPS.' };
  if (!/^sb_publishable_[A-Za-z0-9_-]{4,}$/.test(key))
    return {
      success: false,
      error:
        'Use a Supabase publishable client key (sb_publishable_). Never use a server secret or service-role key.',
    };

  return {
    success: true,
    value: { supabaseUrl: url, supabasePublishableKey: key },
  };
}
