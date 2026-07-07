import React, { useEffect, useRef } from "react";
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
import { FlatTodoItem } from "./api";

const INDENT_WIDTH = 36;

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

interface SortableRowProps {
  item: FlatTodoItem;
  readonly: boolean;
  isBusy: boolean;
  editingId: string | null;
  editingText: string;
  addingChildOfId: string | null;
  childInput: string;
  collapsedIds: Set<string>;
  onToggle: (item: FlatTodoItem) => void;
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
  editingId,
  editingText,
  addingChildOfId,
  childInput,
  collapsedIds,
  onToggle,
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
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id, disabled: readonly || isBusy });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${12 + item.depth * INDENT_WIDTH}px`,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`todo-item${item.completed ? " completed" : ""}${
          addingChildOfId === item._id ? " adding-child-target" : ""
        }${isDragging ? " dragging" : ""}`}
      >
        <div className="todo-item-leading">
          {!readonly && (
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
            <span className="todo-expand-placeholder" aria-hidden="true" />
          )}

          <span className="todo-index">{item.displayIndex}.</span>
        </div>

        <button
          type="button"
          className="todo-checkbox"
          onClick={() => onToggle(item)}
          disabled={isBusy || readonly}
          aria-label={item.completed ? "标记未完成" : "标记完成"}
        >
          {item.completed ? "✓" : ""}
        </button>

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
              {!readonly && (
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
          <div className="todo-item-actions">
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
  collapsedIds,
  onToggleExpand,
}: Pick<SortableRowProps, "item" | "collapsedIds" | "onToggleExpand">) => (
  <li
    className={`todo-item todo-item--readonly${item.completed ? " completed" : ""}`}
    style={{ paddingLeft: `${12 + item.depth * INDENT_WIDTH}px` }}
  >
    <div className="todo-item-leading">
      <span className="todo-drag-handle placeholder" aria-hidden="true" />
      {item.hasChildren ? (
        <TodoExpandToggle
          expanded={!collapsedIds.has(item._id)}
          childCount={item.childCount}
          onClick={() => onToggleExpand(item._id)}
        />
      ) : (
        <span className="todo-expand-placeholder" aria-hidden="true" />
      )}
      <span className="todo-index">{item.displayIndex}.</span>
    </div>
    <span className="todo-checkbox-placeholder" aria-hidden="true" />
    <span className="todo-text" title={item.text}>{item.text}</span>
  </li>
);

const DragOverlayRow = ({ item }: { item: FlatTodoItem }) => (
  <li
    className="todo-item todo-item-overlay"
    style={{ paddingLeft: `${12 + item.depth * INDENT_WIDTH}px` }}
  >
    <div className="todo-item-leading">
      <span className="todo-drag-handle">⠿</span>
      <span className="todo-expand-placeholder" aria-hidden="true" />
      <span className="todo-index">{item.displayIndex}.</span>
    </div>
    <span className={`todo-checkbox${item.completed ? " checked" : ""}`}>
      {item.completed ? "✓" : ""}
    </span>
    <span className="todo-text" title={item.text}>{item.text}</span>
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
}: TodoSortableListProps) => {
  const [draggingItem, setDraggingItem] = React.useState<FlatTodoItem | null>(null);

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
    const item = items.find((i) => i._id === event.active.id);
    if (!item) return;
    setDraggingItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingItem(null);
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
      <ul className="todo-list">
        {items.map((item) => (
          <StaticRow
            key={item._id}
            item={item}
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
        <ul className="todo-list">
          {items.map((item) => (
            <SortableRow
              key={item._id}
              item={item}
              readonly={false}
              isBusy={isBusy}
              editingId={editingId}
              editingText={editingText}
              addingChildOfId={addingChildOfId}
              childInput={childInput}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
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
            />
          ))}
        </ul>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {draggingItem ? <DragOverlayRow item={draggingItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export { TodoSortableList };
