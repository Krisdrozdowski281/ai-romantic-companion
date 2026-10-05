import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  PERSONALITY_MODES,
  VOICE_IDS,
  type PersonalityMode,
  type VoiceId,
} from '@/features/companion/preferences';
import { supabase } from '@/lib/supabase';
export default function Settings() {
  const { session, loading, signOut } = useAuth();
  const [personality, setPersonality] = useState<PersonalityMode>('caring');
  const [voice, setVoice] = useState<VoiceId>('voice_hope');
  const [message, setMessage] = useState<string | null>(null);
  if (loading) return null;
  if (!session) return <Redirect href={'/(auth)' as never} />;
  const save = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('companion_preferences').upsert({
      user_id: session.user.id,
      personality_mode_id: personality,
      voice_id: voice,
    });
    setMessage(error ? 'Could not save preferences.' : 'Preferences saved.');
  };
  return (
    <View style={{ flex: 1, padding: 28, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Account</Text>
      <Text style={{ marginVertical: 12 }}>Companion personality</Text>
      {PERSONALITY_MODES.map((value) => (
        <Pressable key={value} onPress={() => setPersonality(value)}>
          <Text>
            {personality === value ? '✓ ' : ''}
            {value}
          </Text>
        </Pressable>
      ))}
      <Text style={{ marginVertical: 12 }}>Voice</Text>
      {VOICE_IDS.map((value) => (
        <Pressable key={value} onPress={() => setVoice(value)}>
          <Text>
            {voice === value ? '✓ ' : ''}
            {value.replace('voice_', '')}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={() => void save()}>
        <Text style={{ color: '#8c3150', fontWeight: '700', marginTop: 20 }}>
          Save preferences
        </Text>
      </Pressable>
      {message && <Text>{message}</Text>}
      <Pressable onPress={() => void signOut()}>
        <Text style={{ color: '#8c3150', fontWeight: '700', marginTop: 20 }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}
