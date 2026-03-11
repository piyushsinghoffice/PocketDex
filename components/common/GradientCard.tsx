import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Shadow } from '@/theme';

interface GradientCardProps {
  colors: [string, string, ...string[]];
  style?: ViewStyle;
  children: React.ReactNode;
  rounded?: boolean;
}

export function GradientCard({ colors, style, children, rounded = true }: GradientCardProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, rounded && styles.rounded, Shadow.md, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: Radius.lg,
  },
});
