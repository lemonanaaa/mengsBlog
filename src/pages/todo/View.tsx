import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Spin, message } from "antd";
import Layout from "../common/Layout";
import {
  TodoNode,
  TodoWeek,
  DailyStat,
  CompletedTaskItem,
  FlatTodoItem,
  flattenTodoTree,
  fetchActiveTodos,
  fetchWeeks,
  fetchWeekDetail,
  fetchDailyStats,
  fetchCompletedByDate,
  createTodoNode,
  updateTodoNode,
  moveTodoNode,
  deleteTodoNode,
} from "./api";
import { computeVerticalDragMove } from "./dndUtils";
import { TodoSortableList } from "./TodoSortableList";
import {
  buildHeatmapGrid,
  collectAvailableYears,
  getHeatmapPagesForYear,
  getHeatmapRangeForYear,
  getDefaultHeatmapPageIndex,
  getStatsYear,
} from "./dateUtils";
import "../../css/todo/todo.css";

const formatWeekLabel = (week: TodoWeek) => {
  const start = week.weekStart.slice(5).replace("-", "/");
  const end = week.weekEnd.slice(5).replace("-", "/");
  return `${start} – ${end}`;
};

const formatDateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year}年${month}月${day}日`;
};

const DayHoverPanel = ({
  date,
  tasks,
  loading,
  onMouseEnter,
  onMouseLeave,
}: {
  date: string;
  tasks: CompletedTaskItem[];
  loading: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => (
  <aside
    className="todo-day-panel todo-day-panel-side"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <h3 className="todo-day-panel-title">{formatDateLabel(date)} 完成</h3>
    {loading ? (
      <p className="todo-day-panel-empty">加载中…</p>
    ) : tasks.length === 0 ? (
      <p className="todo-day-panel-empty">当天没有完成任务</p>
    ) : (
      <ul className="todo-day-panel-list">
        {tasks.map((task) => (
          <li key={task._id} className="todo-day-panel-item">
            <span className="todo-day-panel-check">✓</span>
            <span className="todo-day-panel-text">
              {task.parentText && (
                <span className="todo-day-panel-parent">{task.parentText} / </span>
              )}
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    )}
  </aside>
);

const Heatmap = ({
  stats,
  statsYear,
  availableYears,
  onYearChange,
  hoveredDate,
  onHoverDate,
  onLeaveHeatmap,
}: {
  stats: DailyStat[];
  statsYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  hoveredDate: string | null;
  onHoverDate: (date: string) => void;
  onLeaveHeatmap: () => void;
}) => {
  const pages = useMemo(() => getHeatmapPagesForYear(statsYear), [statsYear]);
  const [pageIndex, setPageIndex] = useState(() => getDefaultHeatmapPageIndex(statsYear));

  useEffect(() => {
    setPageIndex(getDefaultHeatmapPageIndex(statsYear));
  }, [statsYear]);

  const { totalCompleted, fullRangeLabel, countMap } = useMemo(() => {
    const map = new Map(stats.map((s) => [s.date, s.count]));
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const { startKey, endKey } = getHeatmapRangeForYear(statsYear);
    const [sy, sm, sd] = startKey.split("-").map(Number);
    const [ey, em, ed] = endKey.split("-").map(Number);
    return {
      totalCompleted: total,
      fullRangeLabel: `${sy}/${sm}/${sd} – ${ey}/${em}/${ed}`,
      countMap: map,
    };
  }, [stats, statsYear]);

  const currentPage = pages[pageIndex] ?? pages[pages.length - 1];
  const { columns, monthLabels } = useMemo(
    () => buildHeatmapGrid(currentPage.startKey, currentPage.endKey, countMap),
    [currentPage, countMap]
  );
  const weekCount = columns.length;

  const yearIndex = availableYears.indexOf(statsYear);
  const canGoPrevYear = yearIndex > 0;
  const canGoNextYear = yearIndex >= 0 && yearIndex < availableYears.length - 1;
  const canGoPrev = pageIndex > 0;
  const canGoNext = pageIndex < pages.length - 1;

  return (
    <div className="todo-heatmap">
      <div className="todo-heatmap-summary">
        <span>
          {statsYear}年共完成 <strong>{totalCompleted}</strong> 项
          <span className="todo-heatmap-range">（{fullRangeLabel}）</span>
        </span>
      </div>

      {availableYears.length > 1 && (
        <div className="todo-heatmap-pager todo-heatmap-year-pager">
          <button
            type="button"
            className="todo-heatmap-pager-btn"
            disabled={!canGoPrevYear}
            onClick={() => onYearChange(availableYears[yearIndex - 1])}
            aria-label="上一年"
          >
            ‹
          </button>
          <span className="todo-heatmap-pager-label">{statsYear}年</span>
          <button
            type="button"
            className="todo-heatmap-pager-btn"
            disabled={!canGoNextYear}
            onClick={() => onYearChange(availableYears[yearIndex + 1])}
            aria-label="下一年"
          >
            ›
          </button>
        </div>
      )}

      {pages.length > 1 && (
        <div className="todo-heatmap-pager">
          <button
            type="button"
            className="todo-heatmap-pager-btn"
            disabled={!canGoPrev}
            onClick={() => setPageIndex((i) => i - 1)}
            aria-label="上一页"
          >
            ‹
          </button>
          <span className="todo-heatmap-pager-label">{currentPage.label}</span>
          <button
            type="button"
            className="todo-heatmap-pager-btn"
            disabled={!canGoNext}
            onClick={() => setPageIndex((i) => i + 1)}
            aria-label="下一页"
          >
            ›
          </button>
        </div>
      )}

      <div className="todo-heatmap-main" onMouseLeave={onLeaveHeatmap}>
        <div className="todo-heatmap-grid-wrap">
            <div className="todo-heatmap-body">
              <div className="todo-heatmap-day-labels">
                <span />
                <span>一</span>
                <span />
                <span>三</span>
                <span />
                <span>五</span>
                <span />
              </div>
              <div className="todo-heatmap-scroll">
                <div
                  className="todo-heatmap-months"
                  style={{ "--week-count": weekCount } as React.CSSProperties}
                >
                  {monthLabels.map((m) => (
                    <span
                      key={`${m.label}-${m.index}`}
                      className="todo-heatmap-month-label"
                      style={{ gridColumnStart: m.index + 1 }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
                <div
                  className="todo-heatmap-columns"
                  style={{ "--week-count": weekCount } as React.CSSProperties}
                >
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="todo-heatmap-column">
                    {col.map((cell, rowIdx) =>
                      cell ? (
                        <button
                          key={cell.date}
                          type="button"
                          className={`todo-heatmap-cell level-${cell.level}${
                            hoveredDate === cell.date ? " is-hovered" : ""
                          }`}
                          title={`${cell.date}：完成 ${cell.count} 项`}
                          aria-label={`${cell.date}，完成 ${cell.count} 项`}
                          onMouseEnter={() => onHoverDate(cell.date)}
                        />
                      ) : (
                        <span
                          key={`empty-${colIdx}-${rowIdx}`}
                          className="todo-heatmap-cell empty"
                        />
                      )
                    )}
                  </div>
                ))}
                </div>
              </div>
            </div>
          </div>

          <div className="todo-heatmap-legend">
            <span className="todo-heatmap-legend-edge">少</span>
            {[
              { level: 0, label: "0" },
              { level: 1, label: "1" },
              { level: 2, label: "2-3" },
              { level: 3, label: "4-5" },
              { level: 4, label: "6+" },
            ].map(({ level, label }) => (
              <span key={level} className="todo-heatmap-legend-item">
                <span className={`todo-heatmap-cell level-${level}`} />
                <span className="todo-heatmap-legend-label">{label}</span>
              </span>
            ))}
            <span className="todo-heatmap-legend-edge">多</span>
          </div>

          {totalCompleted === 0 && (
            <p className="todo-heatmap-hint">标记任务完成后，格子颜色会按每日完成数量加深</p>
          )}
      </div>
    </div>
  );
};

const TodoView = () => {
  const [week, setWeek] = useState<TodoWeek | null>(null);
  const [nodes, setNodes] = useState<TodoNode[]>([]);
  const [weeks, setWeeks] = useState<TodoWeek[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [readonly, setReadonly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [input, setInput] = useState("");
  const [addingChildOfId, setAddingChildOfId] = useState<string | null>(null);
  const [childInput, setChildInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [viewWeekKey, setViewWeekKey] = useState<string | null>(null);
  const [heatmapOpen, setHeatmapOpen] = useState(false);
  const [statsYear, setStatsYear] = useState(() => getStatsYear());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [dayTasks, setDayTasks] = useState<CompletedTaskItem[]>([]);
  const [dayTasksLoading, setDayTasksLoading] = useState(false);
  const hoverHideTimer = useRef<number>();
  const dayTasksCache = useRef<Map<string, CompletedTaskItem[]>>(new Map());

  const clearHoverTimer = () => {
    window.clearTimeout(hoverHideTimer.current);
  };

  const scheduleClearHover = useCallback(() => {
    clearHoverTimer();
    hoverHideTimer.current = window.setTimeout(() => setHoveredDate(null), 150);
  }, []);

  const handleHoverDate = useCallback(
    (date: string) => {
      clearHoverTimer();
      setHoveredDate(date);
    },
    []
  );

  const keepHover = useCallback(() => {
    clearHoverTimer();
  }, []);

  const flatItems = useMemo(
    () => flattenTodoTree(nodes, collapsedIds),
    [nodes, collapsedIds]
  );
  const totalCompleted = useMemo(
    () => dailyStats.reduce((sum, s) => sum + s.count, 0),
    [dailyStats]
  );

  const availableYears = useMemo(() => collectAvailableYears(weeks), [weeks]);

  const loadDailyStats = useCallback(async (year: number) => {
    const { startKey, endKey } = getHeatmapRangeForYear(year);
    const stats = await fetchDailyStats(startKey, endKey);
    setDailyStats(stats);
  }, []);

  const handleStatsYearChange = useCallback((year: number) => {
    setStatsYear(year);
    setHoveredDate(null);
    dayTasksCache.current.clear();
  }, []);

  const loadWeekData = useCallback(async (weekKey?: string | null) => {
    setLoading(true);
    try {
      if (!weekKey) {
        const data = await fetchActiveTodos();
        setWeek(data.week);
        setNodes(data.nodes);
        setReadonly(false);
        setViewWeekKey(data.week.weekKey);
      } else {
        const data = await fetchWeekDetail(weekKey);
        setWeek(data.week);
        setNodes(data.nodes);
        setReadonly(data.readonly);
        setViewWeekKey(weekKey);
      }
    } catch (error) {
      console.error("加载待办失败:", error);
      message.error("加载待办失败，请确认后端服务已启动");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      const weekList = await fetchWeeks();
      setWeeks(weekList);
    } catch (error) {
      console.error("加载元数据失败:", error);
    }
  }, []);

  useEffect(() => {
    loadWeekData(null);
    loadMeta();
  }, [loadWeekData, loadMeta]);

  useEffect(() => {
    loadDailyStats(statsYear).catch((error) => {
      console.error("加载日历统计失败:", error);
    });
  }, [statsYear, loadDailyStats]);

  useEffect(() => {
    if (!hoveredDate) {
      setDayTasks([]);
      setDayTasksLoading(false);
      return;
    }

    const cached = dayTasksCache.current.get(hoveredDate);
    if (cached) {
      setDayTasks(cached);
      setDayTasksLoading(false);
      return;
    }

    let cancelled = false;
    setDayTasksLoading(true);

    fetchCompletedByDate(hoveredDate)
      .then((tasks) => {
        if (!cancelled) {
          dayTasksCache.current.set(hoveredDate, tasks);
          setDayTasks(tasks);
        }
      })
      .catch((error) => {
        console.error("加载当日完成任务失败:", error);
        if (!cancelled) setDayTasks([]);
      })
      .finally(() => {
        if (!cancelled) setDayTasksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hoveredDate]);

  const runAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
      await loadMeta();
      dayTasksCache.current.clear();
      await loadDailyStats(statsYear);
    } catch (error) {
      console.error("操作失败:", error);
      message.error("操作失败，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async () => {
    const text = input.trim();
    if (!text || actionLoading || readonly) return;

    await runAction(async () => {
      const created = await createTodoNode(text, null);
      setNodes((prev) => [...prev, created]);
      setInput("");
    });
  };

  const handleAddChild = async (parentId: string) => {
    const text = childInput.trim();
    if (!text || actionLoading || readonly) return;

    await runAction(async () => {
      const created = await createTodoNode(text, parentId);
      setNodes((prev) => [...prev, created]);
      setChildInput("");
      setAddingChildOfId(null);
    });
  };

  const handleCancelAddChild = () => {
    setAddingChildOfId(null);
    setChildInput("");
  };

  const handleToggleExpand = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggle = async (item: FlatTodoItem) => {
    if (actionLoading || readonly) return;

    await runAction(async () => {
      const updated = await updateTodoNode(item._id, { completed: !item.completed });
      setNodes((prev) => prev.map((n) => (n._id === item._id ? updated : n)));
    });
  };

  const handleDelete = async (id: string) => {
    if (actionLoading || readonly) return;

    await runAction(async () => {
      await deleteTodoNode(id);
      const removeIds = new Set<string>();
      const collect = (parentId: string) => {
        removeIds.add(parentId);
        nodes.filter((n) => n.parentId === parentId).forEach((c) => collect(c._id));
      };
      collect(id);
      setNodes((prev) => prev.filter((n) => !removeIds.has(n._id)));
      if (addingChildOfId && removeIds.has(addingChildOfId)) {
        setAddingChildOfId(null);
        setChildInput("");
      }
    });
  };

  const handleSaveEdit = async (id: string) => {
    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    if (actionLoading || readonly) return;

    await runAction(async () => {
      const updated = await updateTodoNode(id, { text });
      setNodes((prev) => prev.map((n) => (n._id === id ? updated : n)));
      setEditingId(null);
      setEditingText("");
    });
  };

  const handleDragMove = async (activeId: string, overId: string) => {
    if (actionLoading || readonly) return;

    const payload = computeVerticalDragMove(flatItems, activeId, overId);
    if (!payload) return;

    await runAction(async () => {
      await moveTodoNode(activeId, payload);
      if (!viewWeekKey || week?.status === "active") {
        const data = await fetchActiveTodos();
        setNodes(data.nodes);
      } else {
        const data = await fetchWeekDetail(viewWeekKey);
        setNodes(data.nodes);
      }
    });
  };

  const handleWeekChange = (weekKey: string) => {
    const target = weeks.find((w) => w.weekKey === weekKey);
    if (!target) return;
    if (target.status === "active") {
      loadWeekData(null);
    } else {
      loadWeekData(weekKey);
    }
  };

  const isBusy = loading || actionLoading;

  return (
    <Layout>
      <div className="todo-page">
        <header className="todo-header">
          <div>
            <h1>每日待办</h1>
            <p className="todo-subtitle">
              以周为单位记录计划与实际完成，未完成项自动滚入下周。
            </p>
          </div>
          {week && (
            <div className="todo-week-picker">
              <select
                value={viewWeekKey || week.weekKey}
                onChange={(e) => handleWeekChange(e.target.value)}
                disabled={isBusy}
              >
                {weeks.map((w) => (
                  <option key={w.weekKey} value={w.weekKey}>
                    {formatWeekLabel(w)}
                    {w.status === "active" ? " · 当前" : " · 归档"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className={`todo-heatmap-wrap${heatmapOpen ? " is-open" : ""}`}>
          <section className={`todo-heatmap-section${heatmapOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="todo-heatmap-toggle"
              onClick={() => setHeatmapOpen((open) => !open)}
              aria-expanded={heatmapOpen}
            >
              <span className="todo-section-title">完成日历</span>
              <span className="todo-heatmap-toggle-meta">
                {statsYear}年共完成 {totalCompleted} 项
                <span className="todo-heatmap-toggle-icon">{heatmapOpen ? "▾" : "▸"}</span>
              </span>
            </button>
            {heatmapOpen && (
              <Heatmap
                key={statsYear}
                stats={dailyStats}
                statsYear={statsYear}
                availableYears={availableYears}
                onYearChange={handleStatsYearChange}
                hoveredDate={hoveredDate}
                onHoverDate={handleHoverDate}
                onLeaveHeatmap={scheduleClearHover}
              />
            )}
          </section>

          {heatmapOpen && hoveredDate && (
            <DayHoverPanel
              date={hoveredDate}
              tasks={dayTasks}
              loading={dayTasksLoading}
              onMouseEnter={keepHover}
              onMouseLeave={scheduleClearHover}
            />
          )}
        </div>

        {loading ? (
          <div className="todo-loading">
            <Spin tip="加载中…" />
          </div>
        ) : (
          <section className="todo-workspace">
            {readonly && (
              <p className="todo-readonly-hint">正在查看历史周快照（只读）</p>
            )}

            {flatItems.length === 0 ? (
              <p className="todo-empty">还没有任务，在下方输入后按回车添加</p>
            ) : (
              <TodoSortableList
                items={flatItems}
                readonly={readonly}
                isBusy={isBusy}
                editingId={editingId}
                editingText={editingText}
                addingChildOfId={addingChildOfId}
                childInput={childInput}
                onDragMove={handleDragMove}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onStartEdit={(item) => {
                  setEditingId(item._id);
                  setEditingText(item.text);
                }}
                onEditTextChange={setEditingText}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={() => {
                  setEditingId(null);
                  setEditingText("");
                }}
                onStartAddChild={(id) => {
                  setEditingId(null);
                  setEditingText("");
                  setAddingChildOfId(id);
                  setChildInput("");
                  setCollapsedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  });
                }}
                onChildInputChange={setChildInput}
                onSubmitChild={handleAddChild}
                onCancelAddChild={handleCancelAddChild}
                collapsedIds={collapsedIds}
                onToggleExpand={handleToggleExpand}
              />
            )}

            {!readonly && (
              <div className="todo-input-area">
                <input
                  className="todo-add-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="输入任务，回车添加…"
                  disabled={isBusy}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default TodoView;
