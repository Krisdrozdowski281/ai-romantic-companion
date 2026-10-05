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
  if (parsedUrl.protocol !== 'https:')
    return { success: false, error: 'Supabase URL must use HTTPS.' };

  return {
    success: true,
    value: { supabaseUrl: url, supabasePublishableKey: key },
  };
}
