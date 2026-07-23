import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FlatTodoItem, TodoColor, TODO_COLOR_OPTIONS } from "./api";

const INDENT_WIDTH = 36;
const MOBILE_INDENT_WIDTH = 20;

const itemColorClass = (color: TodoColor | null | undefined) =>
  color ? ` todo-item--color-${color}` : "";

/** H5 / 窄屏：关闭拖动与废弃，给正文更多空间 */
const useIsCompactTodo = () => {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768
    );
  });

  useEffect(() => {
    const sync = () => {
      setCompact(
        window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768
      );
    };
    const media = window.matchMedia("(pointer: coarse)");
    media.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return compact;
};

const TodoExpandToggle = ({
  expanded,
  childCount,
  onClick,
}: {
  expanded: boolean;
  childCount?: number;
  onClick: (e: React.MouseEvent) => void;
}) => {
  const countHint = childCount ? `（${childCount} 项）` : "";
  const actionLabel = expanded ? "折叠子任务" : "展开子任务";

  return (
    <button
      type="button"
      className={`todo-expand-btn${expanded ? " is-expanded" : " is-collapsed"}`}
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={`${actionLabel}${countHint}`}
      title={`${actionLabel}${countHint}`}
    >
      <svg className="todo-expand-chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M6 4.5 10 8 6 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!expanded && childCount != null && childCount > 0 && (
        <span className="todo-expand-badge" aria-hidden="true">
          {childCount}
        </span>
      )}
    </button>
  );
};

const ColorPicker = ({
  itemId,
  color,
  isOpen,
  isBusy,
  onToggleOpen,
  onSelect,
}: {
  itemId: string;
  color: TodoColor | null;
  isOpen: boolean;
  isBusy: boolean;
  onToggleOpen: (id: string | null) => void;
  onSelect: (id: string, color: TodoColor | null) => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        onToggleOpen(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onToggleOpen]);

  return (
    <div className="todo-color-picker" ref={wrapRef}>
      <button
        type="button"
        className={`todo-color-btn${color ? " has-color" : ""}${isOpen ? " is-open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleOpen(isOpen ? null : itemId);
        }}
        disabled={isBusy}
        aria-label={color ? "更改标记颜色" : "标记颜色"}
        aria-expanded={isOpen}
        title={color ? "更改标记颜色" : "标记颜色"}
        style={color ? { "--todo-mark-color": TODO_COLOR_OPTIONS.find((c) => c.key === color)?.value } as React.CSSProperties : undefined}
      >
        <span className="todo-color-btn-swatch" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="todo-color-palette" role="listbox" aria-label="选择标记颜色">
          <button
            type="button"
            className={`todo-color-option todo-color-option--none${!color ? " is-active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(itemId, null);
              onToggleOpen(null);
            }}
            disabled={isBusy}
            title="取消标记"
            aria-label="取消标记"
          >
            <span aria-hidden="true">×</span>
          </button>
          {TODO_COLOR_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`todo-color-option${color === option.key ? " is-active" : ""}`}
              style={{ background: option.value }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(itemId, color === option.key ? null : option.key);
                onToggleOpen(null);
              }}
              disabled={isBusy}
              title={option.label}
              aria-label={`标记为${option.label}`}
              aria-selected={color === option.key}
              role="option"
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SortableRowProps {
  item: FlatTodoItem;
  readonly: boolean;
  isBusy: boolean;
  isCompact: boolean;
  editingId: string | null;
  editingText: string;
  addingChildOfId: string | null;
  childInput: string;
  collapsedIds: Set<string>;
  colorPickerId: string | null;
  onToggle: (item: FlatTodoItem) => void;
  onAbandon: (item: FlatTodoItem) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onStartEdit: (item: FlatTodoItem) => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onStartAddChild: (id: string) => void;
  onChildInputChange: (text: string) => void;
  onSubmitChild: (parentId: string) => void;
  onCancelAddChild: () => void;
  onColorPickerToggle: (id: string | null) => void;
  onSetColor: (id: string, color: TodoColor | null) => void;
}

const SubtaskInput = ({
  parentId,
  parentDepth,
  childInput,
  isBusy,
  onChildInputChange,
  onSubmitChild,
  onCancelAddChild,
}: {
  parentId: string;
  parentDepth: number;
  childInput: string;
  isBusy: boolean;
  onChildInputChange: (text: string) => void;
  onSubmitChild: (parentId: string) => void;
  onCancelAddChild: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [parentId]);

  const handleBlur = () => {
    window.setTimeout(() => {
      const value = inputRef.current?.value ?? "";
      if (!value.trim()) {
        onCancelAddChild();
      }
    }, 0);
  };

  return (
    <li
      className="todo-inline-add"
      style={{ paddingLeft: `${12 + (parentDepth + 1) * INDENT_WIDTH}px` }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="todo-item-leading">
        <span className="todo-drag-handle placeholder" aria-hidden="true" />
        <span className="todo-expand-placeholder" aria-hidden="true" />
        <span className="todo-index placeholder" />
      </span>
      <input
        ref={inputRef}
        className="todo-inline-add-input"
        value={childInput}
        onChange={(e) => onChildInputChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmitChild(parentId);
          }
          if (e.key === "Escape") onCancelAddChild();
        }}
        placeholder="输入子任务，回车添加…"
        disabled={isBusy}
      />
    </li>
  );
}

const SortableRow = ({
  item,
  readonly,
  isBusy,
  isCompact,
  editingId,
  editingText,
  addingChildOfId,
  childInput,
  collapsedIds,
  colorPickerId,
  onToggle,
  onAbandon,
  onDelete,
  onToggleExpand,
  onStartEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onStartAddChild,
  onChildInputChange,
  onSubmitChild,
  onCancelAddChild,
  onColorPickerToggle,
  onSetColor,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item._id,
    disabled: readonly || isBusy || isCompact,
  });

  const indent = isCompact ? MOBILE_INDENT_WIDTH : INDENT_WIDTH;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: isCompact
      ? `${item.depth * indent}px`
      : `${12 + item.depth * indent}px`,
    opacity: isDragging ? 0.45 : 1,
  };

  const hasColor = !!item.color;
  const pickerOpen = colorPickerId === item._id;

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`todo-item${isCompact ? " todo-item--compact" : ""}${
          item.completed ? " completed" : ""
        }${item.abandoned ? " abandoned" : ""}${
          addingChildOfId === item._id ? " adding-child-target" : ""
        }${isDragging ? " dragging" : ""}${itemColorClass(item.color)}${
          pickerOpen ? " color-picker-open" : ""
        }`}
      >
        <div className="todo-item-leading">
          {!readonly && !isCompact && (
            <button
              type="button"
              className="todo-drag-handle"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label="拖动排序"
              title="拖动排序"
            >
              ⠿
            </button>
          )}

          {item.hasChildren ? (
            <TodoExpandToggle
              expanded={!collapsedIds.has(item._id)}
              childCount={item.childCount}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item._id);
              }}
            />
          ) : (
            !isCompact && (
              <span className="todo-expand-placeholder" aria-hidden="true" />
            )
          )}

          <span className="todo-index">{item.displayIndex}.</span>

          {isCompact && (
            <button
              type="button"
              className={`todo-checkbox${item.completed ? " checked" : ""}${
                item.abandoned ? " is-abandoned" : ""
              }`}
              onClick={() => {
                if (item.abandoned) return;
                onToggle(item);
              }}
              disabled={isBusy || readonly || !!item.abandoned}
              aria-label={
                item.abandoned
                  ? "已废弃，不可勾选完成"
                  : item.completed
                    ? "标记未完成"
                    : "标记完成"
              }
            >
              {item.abandoned ? "×" : item.completed ? "✓" : ""}
            </button>
          )}
        </div>

        {!isCompact && (
          <button
            type="button"
            className={`todo-checkbox${item.completed ? " checked" : ""}${
              item.abandoned ? " is-abandoned" : ""
            }`}
            onClick={() => {
              if (item.abandoned) return;
              onToggle(item);
            }}
            disabled={isBusy || readonly || !!item.abandoned}
            aria-label={
              item.abandoned
                ? "已废弃，不可勾选完成"
                : item.completed
                  ? "标记未完成"
                  : "标记完成"
            }
          >
            {item.abandoned ? "×" : item.completed ? "✓" : ""}
          </button>
        )}

        {editingId === item._id ? (
          <input
            className="todo-edit-input"
            value={editingText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onBlur={(e) => {
              const related = e.relatedTarget as HTMLElement | null;
              if (related?.closest(".todo-add-child-btn, .todo-inline-add-input")) return;
              if (!editingText.trim()) {
                onCancelEdit();
              } else {
                onSaveEdit(item._id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(item._id);
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            disabled={isBusy}
          />
        ) : (
          <span className="todo-text-wrap">
            <span className="todo-text-line">
              <span
                className="todo-text"
                title={item.text}
                onDoubleClick={() => {
                  if (!readonly) onStartEdit(item);
                }}
              >
                {item.text}
              </span>
              {item.abandoned && <span className="todo-abandoned-badge">已废弃</span>}
              {!readonly && !item.abandoned && (
                <button
                  type="button"
                  className="todo-add-child-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartAddChild(item._id);
                  }}
                  disabled={isBusy}
                >
                  子任务
                </button>
              )}
            </span>
          </span>
        )}

        {!readonly && (
          <div
            className={`todo-item-actions${
              hasColor || pickerOpen || (!isCompact && item.abandoned) ? " is-visible" : ""
            }`}
          >
            {!item.abandoned && (
              <ColorPicker
                itemId={item._id}
                color={item.color ?? null}
                isOpen={pickerOpen}
                isBusy={isBusy}
                onToggleOpen={onColorPickerToggle}
                onSelect={onSetColor}
              />
            )}
            {!isCompact && (
              <button
                type="button"
                className={`todo-abandon${item.abandoned ? " is-active" : ""}`}
                onClick={() => onAbandon(item)}
                disabled={isBusy}
                aria-label={item.abandoned ? "取消废弃" : "标记为已废弃"}
                title={item.abandoned ? "取消废弃" : "标记为已废弃"}
              >
                {item.abandoned ? "恢复" : "设为废弃"}
              </button>
            )}
            <button
              type="button"
              className="todo-delete"
              onClick={() => onDelete(item._id)}
              disabled={isBusy}
              aria-label="删除"
            >
              ×
            </button>
          </div>
        )}
      </li>

      {addingChildOfId === item._id && !readonly && (
        <SubtaskInput
          parentId={item._id}
          parentDepth={item.depth}
          childInput={childInput}
          isBusy={isBusy}
          onChildInputChange={onChildInputChange}
          onSubmitChild={onSubmitChild}
          onCancelAddChild={onCancelAddChild}
        />
      )}
    </>
  );
};

const StaticRow = ({
  item,
  isCompact = false,
  collapsedIds,
  onToggleExpand,
}: Pick<SortableRowProps, "item" | "collapsedIds" | "onToggleExpand"> & {
  isCompact?: boolean;
}) => (
  <li
    className={`todo-item todo-item--readonly${isCompact ? " todo-item--compact" : ""}${
      item.completed ? " completed" : ""
    }${item.abandoned ? " abandoned" : ""}${itemColorClass(item.color)}`}
    style={{
      paddingLeft: isCompact
        ? `${item.depth * MOBILE_INDENT_WIDTH}px`
        : `${12 + item.depth * INDENT_WIDTH}px`,
    }}
  >
    <div className="todo-item-leading">
      {!isCompact && (
        <span className="todo-drag-handle placeholder" aria-hidden="true" />
      )}
      {item.hasChildren ? (
        <TodoExpandToggle
          expanded={!collapsedIds.has(item._id)}
          childCount={item.childCount}
          onClick={() => onToggleExpand(item._id)}
        />
      ) : (
        !isCompact && (
          <span className="todo-expand-placeholder" aria-hidden="true" />
        )
      )}
      <span className="todo-index">{item.displayIndex}.</span>
    </div>
    <span className="todo-checkbox-placeholder" aria-hidden="true" />
    <span className="todo-text-wrap">
      <span className="todo-text-line">
        <span className="todo-text" title={item.text}>
          {item.text}
        </span>
        {item.abandoned && <span className="todo-abandoned-badge">已废弃</span>}
      </span>
    </span>
  </li>
);

const DragOverlayRow = ({ item }: { item: FlatTodoItem }) => (
  <li
    className={`todo-item todo-item-overlay${item.completed ? " completed" : ""}${
      item.abandoned ? " abandoned" : ""
    }${itemColorClass(item.color)}`}
    style={{ paddingLeft: `${12 + item.depth * INDENT_WIDTH}px` }}
  >
    <div className="todo-item-leading">
      <span className="todo-drag-handle">⠿</span>
      <span className="todo-expand-placeholder" aria-hidden="true" />
      <span className="todo-index">{item.displayIndex}.</span>
    </div>
    <span
      className={`todo-checkbox${item.completed ? " checked" : ""}${
        item.abandoned ? " is-abandoned" : ""
      }`}
    >
      {item.abandoned ? "×" : item.completed ? "✓" : ""}
    </span>
    <span className="todo-text-wrap">
      <span className="todo-text-line">
        <span className="todo-text" title={item.text}>
          {item.text}
        </span>
        {item.abandoned && <span className="todo-abandoned-badge">已废弃</span>}
      </span>
    </span>
  </li>
);

interface TodoSortableListProps {
  items: FlatTodoItem[];
  readonly: boolean;
  isBusy: boolean;
  editingId: string | null;
  editingText: string;
  addingChildOfId: string | null;
  childInput: string;
  collapsedIds: Set<string>;
  onDragMove: (activeId: string, overId: string) => void;
  onToggle: (item: FlatTodoItem) => void;
  onAbandon: (item: FlatTodoItem) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onStartEdit: (item: FlatTodoItem) => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onStartAddChild: (id: string) => void;
  onChildInputChange: (text: string) => void;
  onSubmitChild: (parentId: string) => void;
  onCancelAddChild: () => void;
  onSetColor: (id: string, color: TodoColor | null) => void;
}

const TodoSortableList = ({
  items,
  readonly,
  isBusy,
  editingId,
  editingText,
  addingChildOfId,
  childInput,
  collapsedIds,
  onDragMove,
  onToggle,
  onAbandon,
  onDelete,
  onToggleExpand,
  onStartEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onStartAddChild,
  onChildInputChange,
  onSubmitChild,
  onCancelAddChild,
  onSetColor,
}: TodoSortableListProps) => {
  const isCompact = useIsCompactTodo();
  const [draggingItem, setDraggingItem] = useState<FlatTodoItem | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canDragTogether = (active: FlatTodoItem, over: FlatTodoItem) =>
    active.depth === over.depth && (active.parentId || null) === (over.parentId || null);

  const siblingCollisionDetection: CollisionDetection = (args) => {
    const activeItem = items.find((item) => item._id === args.active.id);
    if (!activeItem) return closestCenter(args);

    return closestCenter(args).filter((collision) => {
      const overItem = items.find((item) => item._id === collision.id);
      return overItem ? canDragTogether(activeItem, overItem) : false;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isCompact) return;
    const item = items.find((i) => i._id === event.active.id);
    if (!item) return;
    setDraggingItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingItem(null);
    if (isCompact) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeItem = items.find((i) => i._id === active.id);
    const overItem = items.find((i) => i._id === over.id);
    if (!activeItem || !overItem) return;
    if (!canDragTogether(activeItem, overItem)) return;
    onDragMove(String(active.id), String(over.id));
  };

  if (readonly) {
    return (
      <ul className={`todo-list${isCompact ? " todo-list--compact" : ""}`}>
        {items.map((item) => (
          <StaticRow
            key={item._id}
            item={item}
            isCompact={isCompact}
            collapsedIds={collapsedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={siblingCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
        <ul className={`todo-list${isCompact ? " todo-list--compact" : ""}`}>
          {items.map((item) => (
            <SortableRow
              key={item._id}
              item={item}
              readonly={false}
              isBusy={isBusy}
              isCompact={isCompact}
              editingId={editingId}
              editingText={editingText}
              addingChildOfId={addingChildOfId}
              childInput={childInput}
              collapsedIds={collapsedIds}
              colorPickerId={colorPickerId}
              onToggle={onToggle}
              onAbandon={onAbandon}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              onStartEdit={onStartEdit}
              onEditTextChange={onEditTextChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onStartAddChild={onStartAddChild}
              onChildInputChange={onChildInputChange}
              onSubmitChild={onSubmitChild}
              onCancelAddChild={onCancelAddChild}
              onColorPickerToggle={setColorPickerId}
              onSetColor={onSetColor}
            />
          ))}
        </ul>
      </SortableContext>

      {!isCompact && (
        <DragOverlay dropAnimation={null}>
          {draggingItem ? <DragOverlayRow item={draggingItem} /> : null}
        </DragOverlay>
      )}
    </DndContext>
  );
};

export { TodoSortableList };
