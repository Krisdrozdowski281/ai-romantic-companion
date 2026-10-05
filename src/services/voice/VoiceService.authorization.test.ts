import { VoiceService } from './VoiceService';
import type { VoiceAuthorization } from './types';
const authorization: VoiceAuthorization = {
  conversationToken: 'mock-token',
  voiceId: 'abcdefghijklmnopqrst',
  personalityMode: 'caring',
};
function harness(authorize: () => Promise<VoiceAuthorization>) {
  const service = new VoiceService({
    permissionGateway: { requestPermission: async () => 'granted' },
    sessionAuthorizer: { authorize },
  });
  const adapter = {
    startSession: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn().mockResolvedValue(undefined),
    setMuted: jest.fn(),
  };
  service.bindAdapter(adapter);
  return { service, adapter };
}
it('cannot fall back to a public agent when private authorization is missing', async () => {
  const service = new VoiceService({
    permissionGateway: { requestPermission: async () => 'granted' },
  });
  const adapter = {
    startSession: jest.fn(),
    endSession: jest.fn(),
    setMuted: jest.fn(),
  };
  service.bindAdapter(adapter);
  await service.start();
  expect(adapter.startSession).not.toHaveBeenCalled();
  expect(service.getSnapshot().connection).toBe('error');
});
it('cancels an in-flight authorization before starting the provider', async () => {
  let resolve: (value: VoiceAuthorization) => void = () => {};
  const { service, adapter } = harness(
    () =>
      new Promise((finish) => {
        resolve = finish;
      }),
  );
  const pending = service.start();
  await Promise.resolve();
  await service.end();
  resolve(authorization);
  await pending;
  expect(adapter.startSession).not.toHaveBeenCalled();
});
it('closes an SDK session that finishes connecting after cancellation', async () => {
  let finish: () => void = () => {};
  const { service, adapter } = harness(async () => authorization);
  adapter.startSession.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const pending = service.start();
  await Promise.resolve();
  await Promise.resolve();
  await service.end();
  finish();
  await pending;
  expect(adapter.endSession).toHaveBeenCalledTimes(2);
});
