import React, { useMemo, useState } from 'react';
import {
  buildHeatmapGrid,
  getHeatmapPagesForYear,
  getHeatmapRangeForYear,
  getStatsYear,
} from '../todo/dateUtils';
import type { JournalDailyStat } from './api';

interface JournalHeatmapProps {
  stats: JournalDailyStat[];
  statsYear: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const JournalHeatmap = ({
  stats,
  statsYear,
  selectedDate,
  onSelectDate,
}: JournalHeatmapProps) => {
  const [pageIndex] = useState(0);

  const { totalEntries, fullRangeLabel, countMap } = useMemo(() => {
    const map = new Map(stats.map((s) => [s.date, s.count]));
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const { startKey, endKey } = getHeatmapRangeForYear(statsYear);
    const [sy, sm, sd] = startKey.split('-').map(Number);
    const [ey, em, ed] = endKey.split('-').map(Number);
    return {
      totalEntries: total,
      fullRangeLabel: `${sy}/${sm}/${sd} – ${ey}/${em}/${ed}`,
      countMap: map,
    };
  }, [stats, statsYear]);

  const pages = useMemo(() => getHeatmapPagesForYear(statsYear), [statsYear]);
  const currentPage = pages[pageIndex] ?? pages[pages.length - 1];
  const { columns, monthLabels } = useMemo(
    () => buildHeatmapGrid(currentPage.startKey, currentPage.endKey, countMap),
    [currentPage, countMap]
  );
  const weekCount = columns.length;

  return (
    <div className="journal-heatmap">
      <div className="journal-heatmap-summary">
        <span>
          {statsYear}年共写了 <strong>{totalEntries}</strong> 篇
          <span className="journal-heatmap-range">（{fullRangeLabel}）</span>
        </span>
      </div>

      <div className="journal-heatmap-grid-wrap">
        <div className="journal-heatmap-body">
          <div className="journal-heatmap-day-labels">
            <span />
            <span>一</span>
            <span />
            <span>三</span>
            <span />
            <span>五</span>
            <span />
          </div>
          <div className="journal-heatmap-scroll">
            <div
              className="journal-heatmap-months"
              style={{ '--week-count': weekCount } as React.CSSProperties}
            >
              {monthLabels.map((m) => (
                <span
                  key={`${m.label}-${m.index}`}
                  className="journal-heatmap-month-label"
                  style={{ gridColumnStart: m.index + 1 }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div
              className="journal-heatmap-columns"
              style={{ '--week-count': weekCount } as React.CSSProperties}
            >
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="journal-heatmap-column">
                  {col.map((cell, rowIdx) =>
                    cell ? (
                      <button
                        key={cell.date}
                        type="button"
                        className={`journal-heatmap-cell level-${cell.level}${
                          selectedDate === cell.date ? ' is-selected' : ''
                        }`}
                        title={`${cell.date}：${cell.count} 篇`}
                        aria-label={`${cell.date}，${cell.count} 篇`}
                        aria-pressed={selectedDate === cell.date}
                        onClick={() => onSelectDate(cell.date)}
                      />
                    ) : (
                      <span
                        key={`empty-${colIdx}-${rowIdx}`}
                        className="journal-heatmap-cell empty"
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="journal-heatmap-legend">
        <span className="journal-heatmap-legend-edge">少</span>
        {[
          { level: 0, label: '0' },
          { level: 1, label: '1' },
          { level: 2, label: '2-3' },
          { level: 3, label: '4-5' },
          { level: 4, label: '6+' },
        ].map(({ level, label }) => (
          <span key={level} className="journal-heatmap-legend-item">
            <span className={`journal-heatmap-cell level-${level}`} />
            <span className="journal-heatmap-legend-label">{label}</span>
          </span>
        ))}
        <span className="journal-heatmap-legend-edge">多</span>
      </div>
    </div>
  );
};

export default JournalHeatmap;
