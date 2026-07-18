import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VoiceState } from '@/services/voice/types';

interface ConversationViewProps {
  state: VoiceState;
  onStart(): void;
  onEnd(): void;
  onToggleMuted(): void;
}

const STATUS_LABELS: Record<VoiceState['connection'], string> = {
  idle: 'Ready',
  'requesting-permission': 'Requesting microphone permission…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  ending: 'Ending…',
  error: 'Needs attention',
};

export function ConversationView({
  state,
  onStart,
  onEnd,
  onToggleMuted,
}: ConversationViewProps) {
  const isBusy = [
    'requesting-permission',
    'connecting',
    'reconnecting',
    'ending',
  ].includes(state.connection);
  const isActive = ['connected', 'reconnecting'].includes(state.connection);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice conversation</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {STATUS_LABELS[state.connection]}
      </Text>

      {state.connection === 'connected' ? (
        <View style={styles.modePanel}>
          <Text
            testID="listening-state"
            style={state.mode === 'listening' && styles.activeMode}
          >
            {state.mode === 'listening' ? '● Listening' : '○ Listening'}
          </Text>
          <Text
            testID="speaking-state"
            style={state.mode === 'speaking' && styles.activeMode}
          >
            {state.mode === 'speaking' ? '● Speaking' : '○ Speaking'}
          </Text>
        </View>
      ) : null}

      {state.error ? (
        <View accessibilityRole="alert" style={styles.errorPanel}>
          <Text style={styles.errorTitle}>
            {state.error.code === 'microphone-permission'
              ? 'Microphone permission required'
              : 'Voice conversation error'}
          </Text>
          <Text style={styles.errorText}>{state.error.message}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        {!isActive ? (
          <Pressable
            accessibilityRole="button"
            disabled={isBusy || state.error?.code === 'configuration'}
            onPress={onStart}
            style={({ pressed }) => [
              styles.primaryButton,
              (isBusy || state.error?.code === 'configuration') &&
                styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>Start conversation</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onEnd}
            style={styles.endButton}
          >
            <Text style={styles.primaryButtonText}>End conversation</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: state.connection !== 'connected',
            selected: state.muted,
          }}
          disabled={state.connection !== 'connected'}
          onPress={onToggleMuted}
          style={[
            styles.secondaryButton,
            state.connection !== 'connected' && styles.disabledButton,
          ]}
        >
          <Text>{state.muted ? 'Unmute microphone' : 'Mute microphone'}</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>AI companion · Development voice proof</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2b2020',
    marginBottom: 12,
  },
  status: { fontSize: 18, color: '#564747', marginBottom: 24 },
  modePanel: {
    gap: 10,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  activeMode: { color: '#8c3150', fontWeight: '700' },
  errorPanel: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffe8e8',
    marginBottom: 20,
  },
  errorTitle: { fontWeight: '700', color: '#7a1f1f', marginBottom: 6 },
  errorText: { color: '#5c1d1d', lineHeight: 20 },
  controls: { gap: 12, marginTop: 28 },
  primaryButton: { padding: 16, borderRadius: 10, backgroundColor: '#8c3150' },
  endButton: { padding: 16, borderRadius: 10, backgroundColor: '#9c2e2e' },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#eee7e4',
  },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.75 },
  note: { marginTop: 30, textAlign: 'center', color: '#786c68', fontSize: 12 },
});
