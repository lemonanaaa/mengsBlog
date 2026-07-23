import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Spin, message } from "antd";
import Layout from "../common/Layout";
import {
  TodoNode,
  TodoWeek,
  DailyStat,
  CompletedTaskItem,
  CreatedTaskItem,
  DayActivity,
  FlatTodoItem,
  flattenTodoTree,
  fetchActiveTodos,
  fetchWeeks,
  fetchWeekDetail,
  fetchDailyStats,
  fetchDayActivity,
  createTodoNode,
  updateTodoNode,
  moveTodoNode,
  deleteTodoNode,
  restoreTodoNode,
  TodoColor,
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
  formatDateLabelWithWeekday,
  formatShanghaiWeekday,
} from "./dateUtils";
import "../../css/todo/todo.css";

const DELETE_UNDO_MS = 8000;
const DELETE_UNDO_SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘Z"
    : "Ctrl+Z";

type DeleteUndoState = {
  rootId: string;
  message: string;
};

const formatWeekLabel = (week: TodoWeek) => {
  const start = week.weekStart.slice(5).replace("-", "/");
  const end = week.weekEnd.slice(5).replace("-", "/");
  return `${start} ${formatShanghaiWeekday(week.weekStart)} – ${end} ${formatShanghaiWeekday(week.weekEnd)}`;
};

const DayPanelBody = ({
  activity,
  loading,
  interactive,
  isBusy,
  activeNodes,
  onToggleTask,
}: {
  activity: DayActivity;
  loading: boolean;
  interactive: boolean;
  isBusy: boolean;
  activeNodes: Map<string, TodoNode>;
  onToggleTask: (taskId: string) => void;
}) => {
  const { completed, created } = activity;
  const isEmpty = !loading && completed.length === 0 && created.length === 0;

  const renderLeading = (taskId: string, kind: "completed" | "created") => {
    const node = activeNodes.get(taskId);
    if (interactive && node) {
      return (
        <button
          type="button"
          className={`todo-day-panel-toggle${node.completed ? " is-checked" : ""}`}
          onClick={() => onToggleTask(taskId)}
          disabled={isBusy}
          aria-label={node.completed ? "标记未完成" : "标记完成"}
        >
          {node.completed ? "✓" : ""}
        </button>
      );
    }

    return (
      <span
        className={`todo-day-panel-badge${
          kind === "completed" ? " is-completed" : " is-created"
        }`}
      >
        {kind === "completed" ? "✓" : "+"}
      </span>
    );
  };

  const renderTaskList = (
    tasks: CompletedTaskItem[] | CreatedTaskItem[],
    kind: "completed" | "created"
  ) => {
    if (tasks.length === 0) {
      return <p className="todo-day-panel-empty">无</p>;
    }

    return (
      <ul className="todo-day-panel-list">
        {tasks.map((task) => (
          <li key={`${kind}-${task._id}`} className="todo-day-panel-item">
            {renderLeading(task._id, kind)}
            <span className="todo-day-panel-text">
              {task.parentText && (
                <span className="todo-day-panel-parent">{task.parentText} / </span>
              )}
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return <p className="todo-day-panel-empty">加载中…</p>;
  }

  if (isEmpty) {
    return <p className="todo-day-panel-empty">当天没有任务动态</p>;
  }

  return (
    <>
      <section className="todo-day-panel-section">
        <h4 className="todo-day-panel-section-title">
          完成
          <span className="todo-day-panel-count">{completed.length}</span>
        </h4>
        {renderTaskList(completed, "completed")}
      </section>
      <section className="todo-day-panel-section">
        <h4 className="todo-day-panel-section-title">
          新增
          <span className="todo-day-panel-count">{created.length}</span>
        </h4>
        {renderTaskList(created, "created")}
      </section>
    </>
  );
};

const POPOVER_WIDTH = 240;
const POPOVER_GAP = 6;

const DayPopover = ({
  anchorRef,
  date,
  activity,
  loading,
  pinned,
  readonly,
  isBusy,
  activeNodes,
  onClose,
  onToggleTask,
  onMouseEnter,
  onMouseLeave,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  date: string;
  activity: DayActivity;
  loading: boolean;
  pinned: boolean;
  readonly: boolean;
  isBusy: boolean;
  activeNodes: Map<string, TodoNode>;
  onClose: () => void;
  onToggleTask: (taskId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverHeight = popoverRef.current?.offsetHeight ?? 280;

    let left = rect.right + POPOVER_GAP;
    if (left + POPOVER_WIDTH > window.innerWidth - 8) {
      left = rect.left - POPOVER_GAP - POPOVER_WIDTH;
    }

    let top = rect.top + rect.height / 2;
    const halfHeight = popoverHeight / 2;
    top = Math.max(8 + halfHeight, Math.min(top, window.innerHeight - 8 - halfHeight));

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition, date, activity, loading, pinned]);

  if (!position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`todo-day-popover${pinned ? " is-pinned" : ""}`}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="todo-day-panel-header">
        <h3 className="todo-day-panel-title">{formatDateLabelWithWeekday(date)}</h3>
        {pinned && (
          <button type="button" className="todo-day-panel-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        )}
      </div>
      <DayPanelBody
        activity={activity}
        loading={loading}
        interactive={!readonly}
        isBusy={isBusy}
        activeNodes={activeNodes}
        onToggleTask={onToggleTask}
      />
    </div>,
    document.body
  );
};

const Heatmap = ({
  stats,
  statsYear,
  availableYears,
  onYearChange,
  displayDate,
  pinnedDate,
  activity,
  activityLoading,
  readonly,
  isBusy,
  activeNodes,
  onHoverDate,
  onSelectDate,
  onLeaveHeatmap,
  onClosePinned,
  onToggleTask,
  onKeepHover,
}: {
  stats: DailyStat[];
  statsYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
  displayDate: string | null;
  pinnedDate: string | null;
  activity: DayActivity;
  activityLoading: boolean;
  readonly: boolean;
  isBusy: boolean;
  activeNodes: Map<string, TodoNode>;
  onHoverDate: (date: string) => void;
  onSelectDate: (date: string) => void;
  onLeaveHeatmap: () => void;
  onClosePinned: () => void;
  onToggleTask: (taskId: string) => void;
  onKeepHover: () => void;
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
  const cellAnchorRef = useRef<HTMLButtonElement>(null);

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
                        <span key={cell.date} className="todo-heatmap-cell-wrap">
                          <button
                            ref={displayDate === cell.date ? cellAnchorRef : undefined}
                            type="button"
                            className={`todo-heatmap-cell level-${cell.level}${
                              displayDate === cell.date ? " is-hovered" : ""
                            }${pinnedDate === cell.date ? " is-selected" : ""}`}
                            title={`${formatDateLabelWithWeekday(cell.date)}：完成 ${cell.count} 项`}
                            aria-label={`${formatDateLabelWithWeekday(cell.date)}，完成 ${cell.count} 项`}
                            aria-pressed={pinnedDate === cell.date}
                            onMouseEnter={() => onHoverDate(cell.date)}
                            onClick={() => onSelectDate(cell.date)}
                          />
                        </span>
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
      </div>

      {displayDate && (
        <DayPopover
          anchorRef={cellAnchorRef}
          date={displayDate}
          activity={activity}
          loading={activityLoading}
          pinned={pinnedDate === displayDate}
          readonly={readonly}
          isBusy={isBusy}
          activeNodes={activeNodes}
          onClose={onClosePinned}
          onToggleTask={onToggleTask}
          onMouseEnter={onKeepHover}
          onMouseLeave={onLeaveHeatmap}
        />
      )}

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
        <p className="todo-heatmap-hint">标记任务完成后，格子颜色会按每日完成数量加深；点击格子查看详情</p>
      )}
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
  const [deleteUndo, setDeleteUndo] = useState<DeleteUndoState | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);
  const [dayActivity, setDayActivity] = useState<DayActivity>({ completed: [], created: [] });
  const [dayActivityLoading, setDayActivityLoading] = useState(false);
  const hoverHideTimer = useRef<number>();
  const deleteUndoTimer = useRef<number>();
  const deleteUndoRef = useRef<DeleteUndoState | null>(null);
  const dayActivityCache = useRef<Map<string, DayActivity>>(new Map());
  const displayDateRef = useRef<string | null>(null);

  deleteUndoRef.current = deleteUndo;

  const displayDate = pinnedDate ?? hoveredDate;
  displayDateRef.current = displayDate;

  const activeNodeMap = useMemo(
    () => new Map(nodes.map((node) => [node._id, node])),
    [nodes]
  );

  const clearHoverTimer = useCallback(() => {
    if (hoverHideTimer.current) {
      window.clearTimeout(hoverHideTimer.current);
      hoverHideTimer.current = undefined;
    }
  }, []);

  const scheduleClearHover = useCallback(() => {
    if (pinnedDate) return;
    clearHoverTimer();
    hoverHideTimer.current = window.setTimeout(() => setHoveredDate(null), 150);
  }, [pinnedDate, clearHoverTimer]);

  const handleHoverDate = useCallback(
    (date: string) => {
      if (pinnedDate) return;
      clearHoverTimer();
      setHoveredDate(date);
    },
    [pinnedDate, clearHoverTimer]
  );

  const handleSelectDate = useCallback(
    (date: string) => {
      clearHoverTimer();
      setPinnedDate((prev) => {
        const next = prev === date ? null : date;
        setHoveredDate(next);
        return next;
      });
    },
    [clearHoverTimer]
  );

  const handleClosePinned = useCallback(() => {
    setPinnedDate(null);
    setHoveredDate(null);
  }, []);

  const keepHover = useCallback(() => {
    clearHoverTimer();
  }, [clearHoverTimer]);

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
    setPinnedDate(null);
    dayActivityCache.current.clear();
  }, []);

  const resetWorkspaceDraft = useCallback(() => {
    setInput("");
    setAddingChildOfId(null);
    setChildInput("");
    setEditingId(null);
    setEditingText("");
    setCollapsedIds(new Set());
  }, []);

  const loadWeekData = useCallback(async (weekKey?: string | null) => {
    setLoading(true);
    resetWorkspaceDraft();
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
        setReadonly(data.readonly || data.week.status === "archived");
        setViewWeekKey(weekKey);
      }
    } catch (error) {
      console.error("加载待办失败:", error);
      message.error("加载待办失败，请确认后端服务已启动");
    } finally {
      setLoading(false);
    }
  }, [resetWorkspaceDraft]);

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
    if (!displayDate) {
      setDayActivity({ completed: [], created: [] });
      setDayActivityLoading(false);
      return;
    }

    const cached = dayActivityCache.current.get(displayDate);
    if (cached) {
      setDayActivity(cached);
      setDayActivityLoading(false);
      return;
    }

    let cancelled = false;
    setDayActivityLoading(true);

    fetchDayActivity(displayDate)
      .then((activity) => {
        if (!cancelled) {
          dayActivityCache.current.set(displayDate, activity);
          setDayActivity(activity);
        }
      })
      .catch((error) => {
        console.error("加载当日任务动态失败:", error);
        if (!cancelled) setDayActivity({ completed: [], created: [] });
      })
      .finally(() => {
        if (!cancelled) setDayActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [displayDate]);

  const refreshDayActivity = useCallback(async (date: string) => {
    try {
      const activity = await fetchDayActivity(date);
      dayActivityCache.current.set(date, activity);
      if (displayDateRef.current === date) setDayActivity(activity);
    } catch (error) {
      console.error("刷新当日任务动态失败:", error);
    }
  }, []);

  const runAction = async (
    action: () => Promise<void>,
    options: { refreshStats?: boolean } = {}
  ) => {
    setActionLoading(true);
    try {
      await action();
      await loadMeta();
      dayActivityCache.current.clear();
      if (options.refreshStats) {
        await loadDailyStats(statsYear);
      }
      const date = displayDateRef.current;
      if (date) await refreshDayActivity(date);
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

  const dismissDeleteUndo = useCallback(() => {
    if (deleteUndoTimer.current) {
      window.clearTimeout(deleteUndoTimer.current);
      deleteUndoTimer.current = undefined;
    }
    setDeleteUndo(null);
  }, []);

  const offerDeleteUndo = useCallback((entry: DeleteUndoState) => {
    if (deleteUndoTimer.current) {
      window.clearTimeout(deleteUndoTimer.current);
    }
    setDeleteUndo(entry);
    deleteUndoTimer.current = window.setTimeout(() => {
      setDeleteUndo(null);
      deleteUndoTimer.current = undefined;
    }, DELETE_UNDO_MS);
  }, []);

  const handleToggle = async (item: FlatTodoItem) => {
    if (actionLoading || readonly) return;

    await runAction(async () => {
      const updated = await updateTodoNode(item._id, { completed: !item.completed });
      setNodes((prev) => prev.map((n) => (n._id === item._id ? updated : n)));
    }, { refreshStats: true });
  };

  const handleAbandon = async (item: FlatTodoItem) => {
    if (actionLoading || readonly) return;

    await runAction(async () => {
      const updated = await updateTodoNode(item._id, { abandoned: !item.abandoned });
      setNodes((prev) => prev.map((n) => (n._id === item._id ? updated : n)));
    });
  };

  const handleSetColor = async (id: string, color: TodoColor | null) => {
    if (actionLoading || readonly) return;

    const previousColor = nodes.find((n) => n._id === id)?.color ?? null;
    if (previousColor === color) return;

    await runAction(async () => {
      const updated = await updateTodoNode(id, { color });
      setNodes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    });
  };

  const handleUndoDelete = async () => {
    const pending = deleteUndoRef.current;
    if (!pending || actionLoading || readonly) return;

    dismissDeleteUndo();
    await runAction(async () => {
      const restored = await restoreTodoNode(pending.rootId);
      setNodes((prev) => {
        const existing = new Set(prev.map((n) => n._id));
        const merged = [...prev];
        restored.forEach((node) => {
          if (!existing.has(node._id)) merged.push(node);
        });
        return merged;
      });
    }, { refreshStats: true });
  };

  const handleUndoDeleteRef = useRef(handleUndoDelete);
  handleUndoDeleteRef.current = handleUndoDelete;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      if (!deleteUndoRef.current) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;

      e.preventDefault();
      handleUndoDeleteRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (deleteUndoTimer.current) window.clearTimeout(deleteUndoTimer.current);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (actionLoading || readonly) return;

    const target = nodes.find((n) => n._id === id);
    const removeIds = new Set<string>();
    const collect = (parentId: string) => {
      removeIds.add(parentId);
      nodes.filter((n) => n.parentId === parentId).forEach((c) => collect(c._id));
    };
    collect(id);

    let deleted = false;
    await runAction(async () => {
      await deleteTodoNode(id);
      setNodes((prev) => prev.filter((n) => !removeIds.has(n._id)));
      if (addingChildOfId && removeIds.has(addingChildOfId)) {
        setAddingChildOfId(null);
        setChildInput("");
      }
      deleted = true;
    }, { refreshStats: true });

    if (deleted) {
      const label = target?.text?.trim();
      offerDeleteUndo({
        rootId: id,
        message: label ? `已删除「${label.slice(0, 24)}${label.length > 24 ? "…" : ""}」` : "已删除任务",
      });
    }
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

  const handleToggleFromPanel = async (taskId: string) => {
    if (actionLoading || readonly) return;

    const node = nodes.find((n) => n._id === taskId);
    if (!node) return;

    const date = displayDateRef.current;
    if (date) {
      clearHoverTimer();
      setPinnedDate(date);
      setHoveredDate(date);
    }

    const flatItem =
      flatItems.find((item) => item._id === taskId) ??
      ({
        ...node,
        displayIndex: 0,
        depth: 0,
        hasChildren: false,
        childCount: 0,
      } as FlatTodoItem);

    await handleToggle(flatItem);
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
                displayDate={displayDate}
                pinnedDate={pinnedDate}
                activity={dayActivity}
                activityLoading={dayActivityLoading}
                readonly={readonly}
                isBusy={isBusy}
                activeNodes={activeNodeMap}
                onHoverDate={handleHoverDate}
                onSelectDate={handleSelectDate}
                onLeaveHeatmap={scheduleClearHover}
                onClosePinned={handleClosePinned}
                onToggleTask={handleToggleFromPanel}
                onKeepHover={keepHover}
              />
            )}
          </section>
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
                onAbandon={handleAbandon}
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
                onSetColor={handleSetColor}
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

        {deleteUndo &&
          createPortal(
            <div className="todo-undo-bar" role="status">
              <span className="todo-undo-message">{deleteUndo.message}</span>
              <button
                type="button"
                className="todo-undo-btn"
                onClick={handleUndoDelete}
                disabled={isBusy}
              >
                撤销
                <kbd className="todo-undo-kbd">{DELETE_UNDO_SHORTCUT}</kbd>
              </button>
            </div>,
            document.body
          )}
      </div>
    </Layout>
  );
};

export default TodoView;
