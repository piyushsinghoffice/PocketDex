import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier New',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto',
    bold: 'Roboto',
    mono: 'monospace',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'monospace',
  },
});

export const Typography = {
  // Display
  displayXL: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  displayLG: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  },

  // Headings
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
    lineHeight: 28,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body
  bodyLG: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMD: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySM: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels
  labelLG: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  labelMD: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelSM: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },

  // Mono (for stats/numbers)
  monoLG: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fontFamily?.mono,
    lineHeight: 24,
  },
  monoMD: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: fontFamily?.mono,
    lineHeight: 20,
  },
} as const;
