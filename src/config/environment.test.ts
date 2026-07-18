import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('accepts a public development agent ID', () => {
    expect(
      validateEnvironment({ EXPO_PUBLIC_ELEVENLABS_AGENT_ID: 'agent_abc123' }),
    ).toEqual({
      success: true,
      value: { elevenLabsAgentId: 'agent_abc123' },
    });
  });

  it('rejects a missing agent ID', () => {
    const result = validateEnvironment({});
    expect(result.success).toBe(false);
  });

  it.each(['not_an_agent_id', 'abc123', 'agent_bad-value', 'agent_'])(
    'rejects %s',
    (value) => {
      const result = validateEnvironment({
        EXPO_PUBLIC_ELEVENLABS_AGENT_ID: value,
      });
      expect(result.success).toBe(false);
    },
  );
});
