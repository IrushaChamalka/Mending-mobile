import type { TaskStatus } from '@/shared/api/taskStatus';

/**
 * Color tokens.
 *
 * Values were measured from the Figma PNG exports (see docs/DESIGN_INVENTORY.md §3). Every flat
 * color is an exact Tailwind v3 palette value, but a PNG cannot prove a design token, so treat
 * them as estimates until checked against the Figma file.
 *
 * TODO: verify from Figma
 */
const palette = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal200: '#99F6E4',
  teal700: '#0F766E',
  teal800: '#115E59',
  teal900: '#134E4A',
  green50: '#F0FDF4',
  green100: '#DCFCE7',
  green200: '#BBF7D0',
  green600: '#16A34A',
  green700: '#15803D',
  green800: '#166534',
  amber50: '#FFFBEB',
  amber200: '#FDE68A',
  amber600: '#D97706',
  amber700: '#B45309',
  amber800: '#92400E',
  amber900: '#78350F',
  red50: '#FEF2F2',
  red200: '#FECACA',
  red300: '#FCA5A5',
  red600: '#DC2626',
  red700: '#B91C1C',
  blue50: '#EFF6FF',
  blue200: '#BFDBFE',
  blue600: '#2563EB',
  blue800: '#1E40AF',
  whiteAlpha16: 'rgba(255, 255, 255, 0.16)',
  slate900Alpha50: 'rgba(15, 23, 42, 0.5)',
  slate900Alpha60: 'rgba(15, 23, 42, 0.6)',
  transparent: 'transparent',
} as const;

/** Semantic tokens. Components use these, never the palette. */
export const colors = {
  // Brand
  primary: palette.teal700,
  primaryPressed: palette.teal800, // not designed; proposal
  primaryText: palette.white,
  primarySubtle: palette.teal100,
  primarySurface: palette.teal50,
  /** Border of teal-50 cards (E 5.1 "Available to withdraw"). */
  primaryBorder: palette.teal200,
  primaryStrong: palette.teal800,
  gradientStart: palette.teal700,
  gradientEnd: palette.teal900,
  onPrimaryMuted: palette.teal100,
  onPrimarySubtle: palette.teal200,
  overlayOnPrimary: palette.whiteAlpha16,
  // Surfaces
  background: palette.slate50,
  surface: palette.white,
  surfaceMuted: palette.slate100,
  surfaceSunken: palette.slate200,
  backdrop: palette.slate900Alpha50, // not designed; proposal for dialogs
  cameraOverlay: palette.slate900Alpha60, // not designed; proposal for the viewfinder bars
  cameraBackground: palette.slate900, // not designed; behind the viewfinder while it starts
  transparent: palette.transparent,
  // Text
  textPrimary: palette.slate900,
  textBody: palette.slate700,
  textSecondary: palette.slate500,
  textMuted: palette.slate600,
  textPlaceholder: palette.slate400,
  // Borders
  border: palette.slate200,
  borderStrong: palette.slate300,
  borderFocus: palette.teal700,
  // Success
  success: palette.green600,
  successText: palette.green700,
  successTextStrong: palette.green800,
  successSurface: palette.green50,
  successBorder: palette.green200,
  successRing: palette.green100,
  // Warning
  warning: palette.amber600,
  warningText: palette.amber700,
  warningTextStrong: palette.amber900,
  warningTitle: palette.amber800,
  warningSurface: palette.amber50,
  warningBorder: palette.amber200,
  // Danger
  danger: palette.red600,
  dangerText: palette.red700,
  dangerSurface: palette.red50,
  dangerBorder: palette.red200,
  dangerBorderStrong: palette.red300,
  // Info
  info: palette.blue600,
  infoText: palette.blue800,
  infoSurface: palette.blue50,
  infoBorder: palette.blue200,
  // Charts (E 4.1)
  chartBar: palette.teal700,
  chartBarEmpty: palette.slate200,
  // Disabled buttons (E 5.2 "Review request": slate-300 with white text)
  disabled: palette.slate300,
  disabledText: palette.white,
} as const;

export type ColorToken = keyof typeof colors;

/** Pill and badge tones as designed (success, warning, danger, brand) plus two proposals. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

export interface ToneColors {
  surface: string;
  text: string;
  dot: string;
  border: string;
}

export const statusTones: Record<StatusTone, ToneColors> = {
  success: {
    surface: colors.successSurface,
    text: colors.successText,
    dot: colors.successText,
    border: colors.successBorder,
  },
  warning: {
    surface: colors.warningSurface,
    text: colors.warningText,
    dot: colors.warningText,
    border: colors.warningBorder,
  },
  danger: {
    surface: colors.dangerSurface,
    text: colors.dangerText,
    dot: colors.danger,
    border: colors.dangerBorder,
  },
  info: {
    surface: colors.infoSurface,
    text: colors.infoText,
    dot: colors.info,
    border: colors.infoBorder,
  },
  brand: {
    surface: colors.primarySubtle,
    text: colors.primaryStrong,
    dot: colors.primary,
    border: colors.primarySubtle,
  },
  neutral: {
    surface: colors.surfaceMuted,
    text: colors.textMuted,
    dot: colors.textSecondary,
    border: colors.border,
  },
};

/** Banner tones: surface, border, icon, title and body text. */
export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

export interface BannerColors {
  surface: string;
  border: string;
  icon: string;
  title: string;
  text: string;
}

export const bannerTones: Record<BannerTone, BannerColors> = {
  info: {
    surface: colors.infoSurface,
    border: colors.infoBorder,
    icon: colors.info,
    title: colors.infoText,
    text: colors.infoText,
  },
  success: {
    surface: colors.successSurface,
    border: colors.successBorder,
    icon: colors.success,
    title: colors.successTextStrong,
    text: colors.successTextStrong,
  },
  warning: {
    surface: colors.warningSurface,
    border: colors.warningBorder,
    icon: colors.warningText,
    title: colors.warningTitle,
    text: colors.warningTextStrong,
  },
  danger: {
    surface: colors.dangerSurface,
    border: colors.dangerBorder,
    icon: colors.danger,
    title: colors.dangerText,
    text: colors.dangerText,
  },
};

/** The backend's TaskAssignmentStatus values mapped to a pill tone. */
export const taskStatusTone: Record<TaskStatus, StatusTone> = {
  ASSIGNED: 'info',
  ACCEPTED: 'info',
  REJECTED: 'neutral',
  IN_PROGRESS: 'info',
  SUBMITTED: 'brand',
  REVIEWED: 'success',
  CANCELLED: 'neutral',
};
