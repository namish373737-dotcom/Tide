import { StyleSheet, Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const COLORS = {
  primary: '#0D7377',
  primaryLight: '#14A098',
  primaryDark: '#0A5C5F',
  secondary: '#FF6B6B',
  secondaryLight: '#FF8E8E',
  accent: '#9B59B6',
  accentLight: '#B07CC6',

  background: '#FAFBFC',
  backgroundDark: '#1A1A2E',
  surface: '#FFFFFF',
  surfaceDark: '#16213E',
  surfaceElevated: '#F5F7FA',

  text: '#1A1A2E',
  textSecondary: '#5A5A7A',
  textTertiary: '#8A8A9A',
  textDark: '#FAFBFC',
  textSecondaryDark: '#A0A0B8',

  border: '#E5E7EB',
  borderDark: '#2D2D44',
  divider: '#F0F2F5',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  light: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const TYPOGRAPHY = {
  display: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 48 },
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyLarge: { fontSize: 18, fontWeight: '400' as const, lineHeight: 28 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  buttonLarge: { fontSize: 18, fontWeight: '600' as const, lineHeight: 28 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  badge: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
};

export const GRADIENTS = {
  primary: ['#0D7377', '#14A098'] as const,
  secondary: ['#FF6B6B', '#FF8E8E'] as const,
  hero: ['#0D7377', '#1A1A2E'] as const,
  accent: ['#9B59B6', '#B07CC6'] as const,
  success: ['#10B981', '#34D399'] as const,
  dark: ['#1A1A2E', '#16213E'] as const,
};

export const LAYOUT = {
  screenPadding: SPACING.lg,
  maxContentWidth: 400,
  buttonHeight: 56,
  inputHeight: 52,
  cardPadding: SPACING.lg,
  safeTop: 56,
  safeBottom: 34,
};

export const ANIMATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: LAYOUT.safeTop,
    paddingBottom: LAYOUT.safeBottom,
  },
  scrollContent: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: LAYOUT.safeTop,
    paddingBottom: LAYOUT.safeBottom + SPACING.xl,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: LAYOUT.cardPadding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSelected: {
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderRadius: RADIUS.xl,
    padding: LAYOUT.cardPadding,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonPrimary: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  buttonSecondary: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    height: LAYOUT.buttonHeight,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  buttonTextSecondary: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  buttonTextDisabled: {
    ...TYPOGRAPHY.button,
    color: COLORS.textTertiary,
  },
  input: {
    height: LAYOUT.inputHeight,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.base,
  },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.successLight,
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.success,
  },
});
