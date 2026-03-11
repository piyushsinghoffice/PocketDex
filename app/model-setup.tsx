/**
 * Model Setup Screen
 *
 * Shown on first launch when the on-device GGUF files are not yet present.
 * Downloads the configured GGUF model + mmproj weights and then loads them
 * into the llama.rn context before navigating to the main app.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { DownloadProgress } from '@/components/ui/DownloadProgress';
import { useModelStore } from '@/store/modelStore';
import { ensureModelDownloaded, loadModel } from '@/services/model/ModelManager';
import { MODEL_CONFIG } from '@/constants/models';

export default function ModelSetupScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const {
    status,
    modelProgress,
    mmprojProgress,
    error,
    totalProgress,
    setStatus,
    setModelProgress,
    setMmprojProgress,
    setError,
  } = useModelStore();

  const totalMB = MODEL_CONFIG.MODEL_SIZE_MB + MODEL_CONFIG.MMPROJ_SIZE_MB;

  const startDownload = useCallback(async () => {
    setStatus('downloading');
    setError(null);

    try {
      await ensureModelDownloaded((file, progress) => {
        if (file === 'model')   setModelProgress(progress);
        if (file === 'mmproj')  setMmprojProgress(progress);
      });

      setStatus('loading');
      await loadModel();
      setStatus('ready');
      router.replace('/(tabs)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      setError(msg);
      setStatus('error');
    }
  }, []);

  const total = totalProgress();
  const isDownloading = status === 'downloading';
  const isLoading     = status === 'loading';
  const isError       = status === 'error';

  return (
    <LinearGradient
      colors={['#f4efe7', '#efe3ce', '#f4efe7']}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="hardware-chip-outline" size={56} color="#de3341" />
        </View>

        {/* Heading */}
        <Text style={styles.title}>On-Device AI Setup</Text>
        <Text style={styles.subtitle}>
          PocketDex identifies animals entirely on your device using{' '}
          <Text style={styles.modelName}>{MODEL_CONFIG.name}</Text> — a 450M-parameter
          vision-language model that runs with no internet connection and never uploads your photos.
        </Text>

        {/* Model info cards */}
        <View style={styles.infoGrid}>
          <InfoCard icon="eye-outline"     label="Vision Model" value={MODEL_CONFIG.name} />
          <InfoCard icon="lock-closed-outline" label="Privacy"  value="100% on-device" />
          <InfoCard icon="cloud-download-outline" label="Download" value={`~${totalMB} MB`} />
          <InfoCard icon="wifi-outline"    label="After setup"  value="Works offline" />
        </View>

        {/* Progress section */}
        {(isDownloading || isLoading || status === 'ready') && (
          <View style={styles.progressSection}>
            <DownloadProgress
              label="Language model"
              progress={modelProgress}
              sizeMB={MODEL_CONFIG.MODEL_SIZE_MB}
              done={modelProgress >= 1}
            />
            <DownloadProgress
              label="Vision encoder"
              progress={mmprojProgress}
              sizeMB={MODEL_CONFIG.MMPROJ_SIZE_MB}
              done={mmprojProgress >= 1}
            />

            {isLoading && (
              <View style={styles.loadingRow}>
                <Ionicons name="hourglass-outline" size={16} color={Colors.primary} />
                <Text style={styles.loadingText}>Loading model into memory…</Text>
              </View>
            )}

            {/* Overall progress pill */}
            <View style={styles.overallPill}>
              <Text style={styles.overallText}>
                {isLoading ? 'Finalising…' : `${Math.round(total * 100)}% downloaded`}
              </Text>
            </View>
          </View>
        )}

        {/* Error */}
        {isError && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        {!isDownloading && !isLoading && (
          <TouchableOpacity
            style={styles.button}
            onPress={startDownload}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#de3341', '#b42034']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons
                name={isError ? 'refresh-outline' : 'download-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                {isError ? 'Retry Download' : 'Download & Set Up'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={styles.legal}>
          Model weights are downloaded from HuggingFace and stored locally. Requires a Wi-Fi
          connection for the initial download (~{totalMB} MB).
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={Colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(222,51,65,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(222,51,65,0.32)',
  },
  title: {
    ...Typography.displayLG,
    color: '#221c17',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMD,
    color: '#5a5047',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  modelName: {
    color: '#de3341',
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  infoCard: {
    width: '47%',
    backgroundColor: '#fff8ef',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2d5c2',
    gap: 4,
  },
  infoLabel: {
    ...Typography.labelSM,
    color: '#8c7d70',
    marginTop: Spacing.xs,
  },
  infoValue: {
    ...Typography.labelLG,
    color: '#221c17',
  },
  progressSection: {
    width: '100%',
    backgroundColor: '#fff8ef',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e2d5c2',
    marginBottom: Spacing.xl,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodyMD,
    color: '#de3341',
  },
  overallPill: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(222,51,65,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(222,51,65,0.24)',
  },
  overallText: {
    ...Typography.labelMD,
    color: '#de3341',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyMD,
    color: Colors.error,
    flex: 1,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  buttonText: {
    ...Typography.labelLG,
    color: '#fff',
    fontSize: 16,
  },
  legal: {
    ...Typography.bodySM,
    color: '#7f7367',
    textAlign: 'center',
    lineHeight: 18,
  },
});
