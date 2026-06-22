import { FlatTodoItem } from "./api";

/**
 * 纯纵向拖拽：保持原缩进层级，只改变排序位置
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
  if (activeItem.depth > 0) return null;

  const targetDepth = activeItem.depth;
  const remaining = items.filter((i) => i._id !== activeId);

  let insertIndex = remaining.findIndex((i) => i._id === overId);
  if (insertIndex < 0) return null;
  if (activeIndex < overIndex) {
    insertIndex += 1;
  }

  let parentId: string | null = null;
  if (targetDepth > 0) {
    for (let i = insertIndex - 1; i >= 0; i -= 1) {
      if (remaining[i].depth === targetDepth - 1) {
        parentId = remaining[i]._id;
        break;
      }
    }
    if (!parentId) return null;
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
