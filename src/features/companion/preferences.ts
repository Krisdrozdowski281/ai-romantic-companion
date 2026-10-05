export const PERSONALITY_MODES = ['caring', 'playful', 'confident'] as const;
export const VOICE_IDS = [
  'voice_hope',
  'voice_sarah',
  'voice_charlotte',
] as const;
export type PersonalityMode = (typeof PERSONALITY_MODES)[number];
export type VoiceId = (typeof VOICE_IDS)[number];

export function isPreferenceSelection(value: {
  personalityModeId: string;
  voiceId: string;
}): value is { personalityModeId: PersonalityMode; voiceId: VoiceId } {
  return (
    (PERSONALITY_MODES as readonly string[]).includes(
      value.personalityModeId,
    ) && (VOICE_IDS as readonly string[]).includes(value.voiceId)
  );
}

export interface Preferences {
  personalityModeId: PersonalityMode;
  voiceId: VoiceId;
}
export const DEFAULT_PREFERENCES: Preferences = {
  personalityModeId: 'caring',
  voiceId: 'voice_charlotte',
};
export const VOICE_LABELS: Record<VoiceId, string> = {
  voice_hope: 'Hope',
  voice_sarah: 'Sarah',
  voice_charlotte: 'Charlotte',
};
