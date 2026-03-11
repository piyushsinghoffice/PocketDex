import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';
import { statColor, statLabel } from '@/utils/statGenerator';
import { AnimalStats } from '@/types';

interface StatBarProps {
  statKey: keyof AnimalStats;
  value: number;
  delay?: number;
}

export function StatBar({ statKey, value, delay = 0 }: StatBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const color = statColor(statKey);
  const label = statLabel(statKey);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value / 100,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value, delay]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    ...Typography.labelMD,
    color: '#6f665c',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    ...Typography.monoMD,
  },
  track: {
    height: 10,
    backgroundColor: '#e9dcc7',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
