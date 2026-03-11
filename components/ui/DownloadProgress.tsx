import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface DownloadProgressProps {
  label: string;
  progress: number; // 0–1
  sizeMB: number;
  done: boolean;
}

export function DownloadProgress({ label, progress, sizeMB, done }: DownloadProgressProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const pct   = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.size}>
          {done ? `${sizeMB} MB ✓` : `${Math.round(progress * sizeMB)} / ${sizeMB} MB`}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width, backgroundColor: done ? Colors.success : Colors.primary },
          ]}
        />
      </View>
      <Text style={styles.pct}>{done ? 'Complete' : `${pct}%`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
  },
  size: {
    ...Typography.labelMD,
    color: Colors.textSecondary,
  },
  track: {
    height: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  pct: {
    ...Typography.bodySM,
    color: Colors.textMuted,
  },
});
