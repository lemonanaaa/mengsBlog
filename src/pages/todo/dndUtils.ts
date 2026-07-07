import { FlatTodoItem } from "./api";

/**
 * 纯纵向拖拽：保持原缩进层级与同父节点，只改变排序位置
 */
export function computeVerticalDragMove(
  items: FlatTodoItem[],
  activeId: string,
  overId: string
): { parentId: string | null; afterId?: string } | null {
  if (activeId === overId) return null;

  const activeIndex = items.findIndex((i) => i._id === activeId);
  const overIndex = items.findIndex((i) => i._id === overId);
  if (activeIndex < 0 || overIndex < 0) return null;

  const activeItem = items[activeIndex];
  const overItem = items[overIndex];

  if (activeItem.depth !== overItem.depth) return null;

  const parentId = activeItem.parentId || null;
  if ((overItem.parentId || null) !== parentId) return null;

  const remaining = items.filter((i) => i._id !== activeId);

  let insertIndex = remaining.findIndex((i) => i._id === overId);
  if (insertIndex < 0) return null;
  if (activeIndex < overIndex) {
    insertIndex += 1;
  }

  let afterId: string | undefined;
  for (let i = insertIndex - 1; i >= 0; i -= 1) {
    if ((remaining[i].parentId || null) === parentId) {
      afterId = remaining[i]._id;
      break;
    }
  }

  return { parentId, afterId };
}
