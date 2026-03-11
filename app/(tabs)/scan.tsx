import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useScan } from '@/hooks/useScan';
import { useModelStore } from '@/store/modelStore';
import { MODEL_CONFIG } from '@/constants/models';
import { AnimalScanResult } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Frozen-photo scan overlay ────────────────────────────────────────────────

function AnalysisOverlay({ uri }: { uri: string }) {
  const scanY    = useRef(new Animated.Value(0)).current;
  const flash    = useRef(new Animated.Value(1)).current;
  const labelPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial white flash fades out
    Animated.timing(flash, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    // Scan line loops top → bottom
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    // Label pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(labelPulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(labelPulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scanTranslate = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Frozen photo */}
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Dark tint */}
      <View style={styles.analysisTint} />

      {/* Scan line */}
      <Animated.View
        style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]}
      />

      {/* Glow beneath scan line */}
      <Animated.View
        style={[styles.scanGlow, { transform: [{ translateY: scanTranslate }] }]}
      />

      {/* Corner brackets */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Analysing label */}
      <View style={styles.analysisLabelWrap}>
        <Animated.View style={[styles.analysisPill, { opacity: labelPulse }]}>
          <View style={styles.analysisDot} />
          <Text style={styles.analysisLabel}>ANALYSING</Text>
        </Animated.View>
      </View>

      {/* Initial white flash */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { opacity: flash }]}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const soundRef  = useRef<Audio.Sound | null>(null);
  const { status, error, scan, saveDiscovery, reset } = useScan();
  const { status: modelStatus } = useModelStore();
  const [facing, setFacing]         = useState<'back' | 'front'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [zoom, setZoom]             = useState(0);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showZoom, setShowZoom]     = useState(false);
  const [zoomLevel, setZoomLevel]   = useState(1);

  // Pinch tracking (JS-thread refs, not shared values)
  const baseZoomRef = useRef(0);

  // Animated values for UI feedback
  const zoomOpacity  = useRef(new Animated.Value(0)).current;
  const focusOpacity = useRef(new Animated.Value(0)).current;
  const focusScale   = useRef(new Animated.Value(1.4)).current;
  const zoomFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnalyzing = status === 'analyzing';
  const modelReady  = modelStatus === 'ready';
  const isIdle      = (status === 'idle' || status === 'error') && modelReady;

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    Audio.Sound.createAsync(require('@/assets/sounds/capture.mp3'))
      .then(({ sound }) => { soundRef.current = sound; })
      .catch(() => {});
    return () => {
      soundRef.current?.unloadAsync();
      if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      reset();
      setCapturedUri(null);
      return undefined;
    }, [reset])
  );

  // ── Zoom helpers ─────────────────────────────────────────────────────────

  function applyZoom(newZoom: number) {
    const clamped = Math.max(0, Math.min(1, newZoom));
    setZoom(clamped);
    setZoomLevel(1 + clamped * 4); // 1x – 5x display
  }

  function showZoomIndicator() {
    setShowZoom(true);
    if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
    Animated.timing(zoomOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }

  function hideZoomIndicator() {
    zoomFadeTimer.current = setTimeout(() => {
      Animated.timing(zoomOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() =>
        setShowZoom(false)
      );
    }, 800);
  }

  // ── Focus helpers ─────────────────────────────────────────────────────────

  const triggerFocus = useCallback(
    (x: number, y: number) => {
      setFocusPoint({ x, y });
      focusOpacity.setValue(1);
      focusScale.setValue(1.4);
      Animated.parallel([
        Animated.timing(focusOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(focusScale,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      // expo-camera v17: focus point is set via autoFocus on tap (hardware AF triggered by touch)
    },
    [focusOpacity, focusScale]
  );

  // ── Gestures ─────────────────────────────────────────────────────────────

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      baseZoomRef.current = zoom;
    })
    .onUpdate((e) => {
      const next = baseZoomRef.current + (e.scale - 1) * 0.35;
      applyZoom(next);
      showZoomIndicator();
    })
    .onEnd(() => {
      hideZoomIndicator();
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onStart((e) => {
      triggerFocus(e.x, e.y);
    });

  const cameraGesture = Gesture.Simultaneous(pinchGesture, tapGesture);

  async function handleScan() {
    if (!cameraRef.current || !isIdle) return;

    try {
      // Set recording audio session BEFORE capture — suppresses the system
      // shutter sound on iOS (same mechanism that silences video recording clicks)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: Platform.OS === 'android',
      });

      // Play custom sound, then restore normal audio session
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Could not capture image. Please try again.');
        return;
      }

      // Freeze on the captured photo and start scanning
      setCapturedUri(photo.uri);

      const discovery = await scan(photo.uri);
      if (discovery) {
        await handleSaveAndNavigate(discovery);
      } else {
        // Inference returned null — go back to camera
        setCapturedUri(null);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setCapturedUri(null);
      Alert.alert('Scan failed', 'Something went wrong. Please try again.');
    }
  }

  async function handleSaveAndNavigate(discovery: AnimalScanResult) {
    await saveDiscovery(discovery);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({ pathname: '/discovery/[id]', params: { id: discovery.id } });
  }

  if (!permission) return <View style={styles.centered} />;

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.permIconWrap}>
          <Ionicons name="camera-outline" size={64} color="#de3341" />
        </View>
        <Text style={styles.permTitle}>Camera access required</Text>
        <Text style={styles.permBody}>
          PocketDex needs your camera to identify animals. Your images are processed entirely on-device and never uploaded.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Frozen analysis view ──────────────────────────────────────────────────
  if (capturedUri && isAnalyzing) {
    return (
      <View style={styles.root}>
        <AnalysisOverlay uri={capturedUri} />
      </View>
    );
  }

  // ── Live camera view ──────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <GestureDetector gesture={cameraGesture}>
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            zoom={zoom}
          />

          {/* Corner frame */}
          <View style={styles.frameOverlay} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Focus ring */}
          {focusPoint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusRing,
                {
                  top: focusPoint.y - 32,
                  left: focusPoint.x - 32,
                  opacity: focusOpacity,
                  transform: [{ scale: focusScale }],
                },
              ]}
            />
          )}

          {/* Zoom indicator */}
          {showZoom && (
            <Animated.View style={[styles.zoomPill, { opacity: zoomOpacity }]} pointerEvents="none">
              <Text style={styles.zoomText}>{zoomLevel.toFixed(1)}×</Text>
            </Animated.View>
          )}

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.topBarInner}>
              <View style={styles.badge}>
                <View style={[styles.liveDot, { backgroundColor: modelReady ? Colors.success : Colors.warning }]} />
                <Text style={styles.badgeText}>
                  {modelReady ? `${MODEL_CONFIG.name.toUpperCase()} · ON-DEVICE` : 'LOADING MODEL…'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                style={styles.iconButton}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
            {error && (
              <View style={styles.errorPill}>
                <Ionicons name="warning-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!modelReady && (
              <Text style={styles.hint}>Loading model into memory…</Text>
            )}

            <TouchableOpacity
              style={[styles.scanButton, !isIdle && styles.scanButtonDisabled]}
              onPress={handleScan}
              disabled={!isIdle}
              activeOpacity={0.85}
            >
              <View style={styles.scanButtonInner}>
                <Ionicons name="scan" size={28} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.legalNote}>Images are never stored or uploaded</Text>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER_SIZE   = 32;
const CORNER_BORDER = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#f4efe7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  // Permission screen
  permIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(222,51,65,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(222,51,65,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    ...Typography.h2,
    color: '#221c17',
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  permBody: {
    ...Typography.bodyMD,
    color: '#5a5047',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permButton: {
    backgroundColor: '#de3341',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  permButtonText: {
    ...Typography.labelLG,
    color: '#fff',
  },

  // Camera frame corners (live view)
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Shared corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 40,
    left: 20,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 40,
    right: 20,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 20,
    left: 20,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 20,
    right: 20,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderBottomRightRadius: 6,
  },

  // Top bar
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
    borderColor: 'rgba(255,248,239,0.28)',
    marginTop: Spacing.md,
    marginLeft: Spacing.md,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    ...Typography.labelSM,
    color: '#fff8ef',
    fontSize: 9,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,248,239,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginRight: Spacing.md,
  },

  // Bottom bar
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

  // Focus ring
  focusRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  // Zoom indicator
  zoomPill: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: Spacing.sm,
  },
  zoomText: {
    ...Typography.labelMD,
    color: '#fff',
    fontSize: 14,
  },

  // Analysis overlay
  analysisTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanLine: {
    position: 'absolute',
    top: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  scanGlow: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  analysisLabelWrap: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  analysisPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(10,10,20,0.85)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  analysisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  analysisLabel: {
    ...Typography.labelLG,
    color: Colors.primary,
    letterSpacing: 3,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
});
