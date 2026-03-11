import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '@/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';

interface AchievementBadgeProps {
  achievement: Achievement;
  compact?: boolean;
}

export function AchievementBadge({ achievement, compact = false }: AchievementBadgeProps) {
  const unlocked = !!achievement.unlockedAt;
  const iconColor = unlocked ? '#de3341' : '#8c7d70';
  const bgColor = unlocked ? '#fff8ef' : '#f3ede2';
  const borderColor = unlocked ? '#de3341' : '#d8cfbf';

  if (compact) {
    return (
      <View style={[styles.compactBadge, { backgroundColor: bgColor, borderColor }]}>
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={iconColor}
        />
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }, unlocked && Shadow.sm]}>
      <View style={[styles.iconWrap, { backgroundColor: unlocked ? 'rgba(222,51,65,0.12)' : '#e2d5c2' }]}>
        <Ionicons
          name={achievement.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={iconColor}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, !unlocked && styles.locked]}>{achievement.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{achievement.description}</Text>
        {unlocked && achievement.unlockedAt && (
          <Text style={styles.date}>
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        )}
        {!unlocked && (
          <Text style={styles.condition}>{achievement.condition}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...Typography.labelLG,
    color: '#221c17',
  },
  locked: {
    color: '#8c7d70',
  },
  description: {
    ...Typography.bodySM,
    color: '#5a5047',
    marginTop: 2,
  },
  date: {
    ...Typography.bodySM,
    color: '#de3341',
    marginTop: 4,
  },
  condition: {
    ...Typography.bodySM,
    color: '#8c7d70',
    marginTop: 4,
    fontStyle: 'italic',
  },
  compactBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
