const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Format as YYYY-MM-DD in Asia/Shanghai (matches backend toDateKey). */
export function toShanghaiDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function shanghaiMidnightUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) - SHANGHAI_OFFSET_MS;
}

export function addShanghaiDays(key: string, days: number): string {
  const ms = shanghaiMidnightUtcMs(key) + days * 86400000;
  const shanghaiMs = ms + SHANGHAI_OFFSET_MS;
  const dt = new Date(shanghaiMs);
  const y = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

export function shanghaiDayOfWeek(key: string): number {
  const shanghaiMs = shanghaiMidnightUtcMs(key) + SHANGHAI_OFFSET_MS;
  return new Date(shanghaiMs).getUTCDay();
}

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function formatShanghaiWeekday(dateKey: string): string {
  return WEEKDAY_LABELS[shanghaiDayOfWeek(dateKey)];
}

export function formatDateLabelWithWeekday(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${year}年${month}月${day}日 ${formatShanghaiWeekday(dateKey)}`;
}

export function daysBetweenKeys(startKey: string, endKey: string): number {
  return Math.round(
    (shanghaiMidnightUtcMs(endKey) - shanghaiMidnightUtcMs(startKey)) / 86400000
  );
}

/** 本年度 1 月 1 日 – 12 月 31 日（上海时区） */
export function getHeatmapRange() {
  return getHeatmapRangeForYear(getStatsYear());
}

export function getStatsYear(): number {
  return Number(toShanghaiDateKey(new Date()).split('-')[0]);
}

/** 指定年份：始终为 1/1 – 12/31，未到来的日期格子为空 */
export function getHeatmapRangeForYear(year: number) {
  const currentYear = getStatsYear();
  const y = Math.min(year, currentYear);
  const startKey = `${y}-01-01`;
  const endKey = `${y}-12-31`;
  return { startKey, endKey, year: y };
}

export function collectAvailableYears(
  weeks: { weekStart: string; weekEnd: string }[]
): number[] {
  const currentYear = getStatsYear();
  const years = new Set<number>([currentYear]);
  weeks.forEach((w) => {
    years.add(Number(w.weekStart.slice(0, 4)));
    years.add(Number(w.weekEnd.slice(0, 4)));
  });
  return Array.from(years).filter((y) => y <= currentYear).sort((a, b) => a - b);
}

export function formatRangeLabel(startKey: string, endKey: string): string {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  return `${sy}/${sm}/${sd} – ${ey}/${em}/${ed}`;
}

export interface HeatmapPage {
  startKey: string;
  endKey: string;
  label: string;
}

/** 每一年固定一页，展示完整 1/1 – 12/31 */
export function getHeatmapPagesForYear(year: number): HeatmapPage[] {
  const { startKey, endKey } = getHeatmapRangeForYear(year);
  return [{ startKey, endKey, label: formatRangeLabel(startKey, endKey) }];
}

/** @deprecated 每年仅一页，始终为 0 */
export function getDefaultHeatmapPageIndex(_year: number, _dateKey?: string): number {
  return 0;
}

/** @deprecated 使用 getHeatmapPagesForYear */
export function getHeatmapPages(): HeatmapPage[] {
  return getHeatmapPagesForYear(getStatsYear());
}

/** 0｜1｜2–3｜4–5｜6+ */
export function countToHeatmapLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export interface HeatmapCell {
  date: string;
  count: number;
  level: number;
}

export function buildHeatmapGrid(
  pageStartKey: string,
  pageEndKey: string,
  countMap: Map<string, number>
) {
  const gridStartKey = addShanghaiDays(pageStartKey, -shanghaiDayOfWeek(pageStartKey));
  const gridEndKey = addShanghaiDays(pageEndKey, 6 - shanghaiDayOfWeek(pageEndKey));
  const numWeeks = Math.ceil((daysBetweenKeys(gridStartKey, gridEndKey) + 1) / 7);
  const pageEndYear = Number(pageEndKey.split('-')[0]);

  const columns: (HeatmapCell | null)[][] = [];
  const monthLabels: { label: string; index: number }[] = [];
  let lastMonth = -1;
  let lastYear = -1;

  for (let w = 0; w < numWeeks; w += 1) {
    const col: (HeatmapCell | null)[] = [];
    for (let d = 0; d < 7; d += 1) {
      const dateKey = addShanghaiDays(gridStartKey, w * 7 + d);

      if (dateKey < pageStartKey || dateKey > pageEndKey) {
        col.push(null);
      } else {
        const count = countMap.get(dateKey) || 0;
        const level = countToHeatmapLevel(count);
        col.push({ date: dateKey, count, level });

        const [yearStr, monthStr, dayStr] = dateKey.split('-');
        const month = Number(monthStr);
        const year = Number(yearStr);
        const day = Number(dayStr);
        if (day <= 7 && (month !== lastMonth || year !== lastYear)) {
          monthLabels.push({
            label: year !== pageEndYear ? `${String(year).slice(2)}/${month}月` : `${month}月`,
            index: w,
          });
          lastMonth = month;
          lastYear = year;
        }
      }
    }
    columns.push(col);
  }

  return {
    columns,
    monthLabels,
  };
}
