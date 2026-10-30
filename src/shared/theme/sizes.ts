import { StyleSheet } from 'react-native';

import { moderateScale } from './scale';

/** Component sizes scale gently (30 % of the width ratio), like fonts. */
const SIZE_SCALE_FACTOR = 0.3;

function ms(size: number): number {
  return moderateScale(size, SIZE_SCALE_FACTOR);
}

/** Icon sizes (docs/DESIGN_INVENTORY.md §8). */
export const iconSizes = {
  xs: ms(14),
  sm: ms(18),
  md: ms(20),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(44),
} as const;

export type IconSizeToken = keyof typeof iconSizes;

/** Component dimensions (docs/DESIGN_INVENTORY.md §5 and §7). */
export const sizes = {
  buttonLg: ms(56),
  buttonMd: ms(48),
  buttonSm: ms(42),
  input: ms(56),
  inputDivider: ms(18),
  alertMinHeight: ms(44),
  inputMultiline: ms(120),
  search: ms(44),
  chip: ms(38),
  pill: ms(22),
  dot: ms(6),
  iconButton: ms(40),
  iconTile: ms(40),
  logoTile: ms(36),
  avatarSm: ms(40),
  avatarMd: ms(44),
  avatarLg: ms(68),
  avatarXl: ms(84),
  headerBar: ms(64),
  tabBar: ms(50),
  tabPillWidth: ms(52),
  tabPillHeight: ms(30),
  infoRow: ms(41),
  settingsRow: ms(54),
  queueRow: ms(55),
  listRow: ms(64),
  statTile: ms(68),
  successRing: ms(84),
  successDisc: ms(56),
  thumbnail: ms(52),
  /** Task photo tiles (E 3.2). */
  photoTile: ms(72),
  tableHeader: ms(38),
  tableRow: ms(52),
  /** Bars of the approved-earnings chart (E 4.1). */
  chartHeight: ms(96),
  chartEmptyBar: ms(3),
  /** Password strength segments (E 1.6). */
  strengthBar: ms(5),
  /** One-time-code boxes (E 1.5). */
  otpBox: ms(58),
  /** The big amount field (E 5.1). */
  amountInput: ms(64),
  sheetHandle: ms(4),
  sheetHandleWidth: ms(36),
  shutterRing: ms(72),
  shutterStroke: ms(4),
  borderWidth: 1,
  focusBorderWidth: 2,
  hairline: StyleSheet.hairlineWidth,
  /** 350 × 250 photo frame. */
  photoAspectRatio: 1.4,
} as const;
