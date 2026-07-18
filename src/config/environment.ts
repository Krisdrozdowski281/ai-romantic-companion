export interface AppEnvironment {
  elevenLabsAgentId: string;
}

export type EnvironmentResult =
  { success: true; value: AppEnvironment } | { success: false; error: string };

const AGENT_ID_PATTERN = /^agent_[a-zA-Z0-9]+$/;

export function validateEnvironment(
  environment: Pick<NodeJS.ProcessEnv, 'EXPO_PUBLIC_ELEVENLABS_AGENT_ID'>,
): EnvironmentResult {
  const agentId = environment.EXPO_PUBLIC_ELEVENLABS_AGENT_ID?.trim();

  if (!agentId) {
    return {
      success: false,
      error:
        'Development agent ID is missing. Set EXPO_PUBLIC_ELEVENLABS_AGENT_ID and restart Expo.',
    };
  }

  if (!AGENT_ID_PATTERN.test(agentId)) {
    return {
      success: false,
      error:
        'Development agent ID is invalid. It must start with "agent_" and contain only letters and numbers after the prefix.',
    };
  }

  return { success: true, value: { elevenLabsAgentId: agentId } };
}
