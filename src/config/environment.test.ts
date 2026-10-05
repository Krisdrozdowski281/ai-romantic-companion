import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('accepts public Supabase configuration', () => {
    expect(
      validateEnvironment({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toEqual({
      success: true,
      value: {
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'sb_publishable_test',
      },
    });
  });

  it('rejects a missing agent ID', () => {
    const result = validateEnvironment({});
    expect(result.success).toBe(false);
  });

  it.each(['not-a-url', 'http://example.com'])('rejects %s', (value) => {
    const result = validateEnvironment({
      EXPO_PUBLIC_SUPABASE_URL: value,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    });
    expect(result.success).toBe(false);
  });
});
