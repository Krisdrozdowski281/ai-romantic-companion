import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { validateEnvironment } from '@/config/environment';

const environment = validateEnvironment({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export const supabaseConfigurationError = environment.success
  ? null
  : environment.error;

export const supabase = environment.success
  ? createClient(
      environment.value.supabaseUrl,
      environment.value.supabasePublishableKey,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    )
  : null;
