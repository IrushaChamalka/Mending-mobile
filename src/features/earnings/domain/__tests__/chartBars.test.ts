import { toChartBars } from '../chartBars';

describe('toChartBars', () => {
  it('scales bars against the best day and labels each day of a short period', () => {
    const bars = toChartBars([
      { date: '2026-10-01', amount: 1000 },
      { date: '2026-10-02', amount: 0 },
      { date: '2026-10-03', amount: 500 },
    ]);
    expect(bars.map((bar) => [bar.label, bar.fraction])).toEqual([
      ['1', 1],
      ['2', 0],
      ['3', 0.5],
    ]);
    expect(bars[0]?.accessibilityLabel).toBe('1 Oct: LKR 1,000 approved');
  });

  it('labels every few bars on a long period', () => {
    const days = Array.from({ length: 30 }, (_, index) => ({
      date: `2026-09-${String(index + 1).padStart(2, '0')}`,
      amount: 0,
    }));
    const labels = toChartBars(days).filter((bar) => bar.label !== '');
    expect(labels.length).toBeLessThanOrEqual(10);
    expect(labels[0]?.label).toBe('1');
    expect(toChartBars(days).every((bar) => bar.fraction === 0)).toBe(true);
  });
});
