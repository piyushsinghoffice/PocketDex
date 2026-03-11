import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';

interface ScanOverlayProps {
  isAnalyzing: boolean;
}

const CORNER_SIZE = 28;
const CORNER_BORDER = 3;

export function ScanOverlay({ isAnalyzing }: ScanOverlayProps) {
  const scanLineY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnalyzing) {
      const lineAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineY, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanLineY, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      );
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      lineAnim.start();
      pulseAnim.start();
      return () => {
        lineAnim.stop();
        pulseAnim.stop();
      };
    }
  }, [isAnalyzing]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Corner brackets */}
      <View style={styles.frame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {isAnalyzing && (
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </View>

      {isAnalyzing && (
        <Animated.View style={[styles.statusPill, { transform: [{ scale: pulse }] }]}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>Analysing locally…</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_BORDER,
    borderLeftWidth: CORNER_BORDER,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_BORDER,
    borderRightWidth: CORNER_BORDER,
    borderBottomRightRadius: 6,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  statusPill: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,20,0.85)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 99,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  statusText: {
    ...Typography.labelMD,
    color: Colors.primary,
  },
});
