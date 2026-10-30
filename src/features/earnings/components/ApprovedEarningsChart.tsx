import { memo, type JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, sizes, spacing } from '@/shared/theme';
import { AppText, Card } from '@/shared/ui';

import type { ChartBar } from '../types';

export interface ApprovedEarningsChartProps {
  bars: readonly ChartBar[];
}

/** "Approved earnings by day (LKR)" (E 4.1). Days with nothing approved show a thin grey bar. */
function ApprovedEarningsChartView({ bars }: ApprovedEarningsChartProps): JSX.Element {
  const isDense = bars.length > 14;
  return (
    <Card testID="earnings-chart">
      <AppText variant="bodyStrong" style={styles.title}>
        Approved earnings by day (LKR)
      </AppText>
      <View style={[styles.bars, isDense ? styles.denseGap : styles.gap]}>
        {bars.map((bar) => {
          const height = {
            height: Math.max(bar.fraction * sizes.chartHeight, sizes.chartEmptyBar),
          };
          return (
            <View
              key={bar.key}
              style={styles.column}
              accessible
              accessibilityLabel={bar.accessibilityLabel}
            >
              <View style={styles.track}>
                <View
                  style={[styles.bar, bar.fraction > 0 ? styles.filled : styles.empty, height]}
                />
              </View>
              <AppText variant="micro" weight="regular" color="textPlaceholder" numberOfLines={1}>
                {bar.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export const ApprovedEarningsChart = memo(ApprovedEarningsChartView);

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  bars: { flexDirection: 'row', alignItems: 'flex-end' },
  gap: { gap: spacing.sm + spacing.xxs },
  denseGap: { gap: spacing.xxs },
  column: { flex: 1, alignItems: 'center' },
  track: { height: sizes.chartHeight, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.xs },
  filled: { backgroundColor: colors.chartBar },
  empty: { backgroundColor: colors.chartBarEmpty },
});
