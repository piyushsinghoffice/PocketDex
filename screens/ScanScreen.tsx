import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { ScanOverlay } from '@/components/ui/ScanOverlay';
import { useScan } from '@/hooks/useScan';
import { useModelStore } from '@/store/modelStore';
import { AnimalScanResult } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { status, error, scan, saveDiscovery } = useScan();
  const { status: modelStatus } = useModelStore();
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const isAnalyzing = status === 'analyzing';
  const modelReady  = modelStatus === 'ready';
  const isIdle = (status === 'idle' || status === 'error') && modelReady;

  async function handleScan() {
    if (!cameraRef.current || !isIdle) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: Platform.OS === 'android',
      });

      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Could not capture image. Please try again.');
        return;
      }

      const discovery = await scan(photo.uri);
      if (discovery) {
        await handleSaveAndNavigate(discovery);
      }
    } catch (err) {
      console.error('Scan error:', err);
      Alert.alert('Scan failed', 'Something went wrong. Please try again.');
    }
  }

  async function handleSaveAndNavigate(discovery: AnimalScanResult) {
    await saveDiscovery(discovery);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('DiscoveryResult', { id: discovery.id });
  }

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permTitle}>Camera access required</Text>
        <Text style={styles.permBody}>
          PocketDex AI needs your camera to identify animals. Your images are processed entirely on-device and never uploaded.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      >
        <ScanOverlay isAnalyzing={isAnalyzing} />

        {/* Top controls */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.topBarInner}>
            <View style={styles.badge}>
              <View style={[styles.liveDot, { backgroundColor: modelReady ? Colors.success : Colors.warning }]} />
              <Text style={styles.badgeText}>
                {modelReady ? 'LFM2.5-VL · SERVER' : 'CONNECTING…'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
              style={styles.iconButton}
              disabled={isAnalyzing}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
          {error && (
            <View style={styles.errorPill}>
              <Ionicons name="warning-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.hint}>
            {isAnalyzing
              ? 'Running LFM2.5-VL inference…'
              : !modelReady
              ? 'Connecting to inference server…'
              : 'Point camera at an animal and tap Scan'}
          </Text>

          <TouchableOpacity
            style={[styles.scanButton, isAnalyzing && styles.scanButtonDisabled]}
            onPress={handleScan}
            disabled={isAnalyzing}
            activeOpacity={0.85}
          >
            {isAnalyzing ? (
              <View style={styles.scanButtonInner}>
                <Ionicons name="hourglass-outline" size={28} color="#fff" />
              </View>
            ) : (
              <View style={styles.scanButtonInner}>
                <Ionicons name="scan" size={28} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.legalNote}>Images are never stored or uploaded</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  permTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  permBody: {
    ...Typography.bodyMD,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  permButtonText: {
    ...Typography.labelLG,
    color: '#fff',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    ...Typography.labelSM,
    color: Colors.primary,
    fontSize: 9,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  hint: {
    ...Typography.bodyMD,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.error + '22',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.labelMD,
    color: Colors.error,
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  scanButtonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  scanButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalNote: {
    ...Typography.bodySM,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontSize: 10,
  },
});
