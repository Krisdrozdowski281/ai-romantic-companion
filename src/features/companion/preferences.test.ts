import { DEFAULT_PREFERENCES, isPreferenceSelection } from './preferences';
describe('preference validation', () => {
  it('allows only configured selections', () => {
    expect(
      isPreferenceSelection({
        personalityModeId: 'caring',
        voiceId: 'voice_hope',
      }),
    ).toBe(true);
    expect(
      isPreferenceSelection({
        personalityModeId: 'raw prompt',
        voiceId: 'anything',
      }),
    ).toBe(false);
  });
});

it('defaults to the approved Charlotte development voice', () => {
  expect(DEFAULT_PREFERENCES).toEqual({
    personalityModeId: 'caring',
    voiceId: 'voice_charlotte',
  });
});
