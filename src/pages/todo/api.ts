import { apiRequest } from '../../config/api';

export interface TodoNode {
  _id: string;
  text: string;
  completed: boolean;
  parentId: string | null;
  sortOrder: number;
  weekKey: string;
  originWeekKey: string;
  completedAt: string | null;
  completedWeekKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoWeek {
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  status: 'active' | 'archived';
  stats?: {
    total: number;
    completed?: number;
    rolledOver?: number;
    completedByDay?: Record<string, number>;
  };
  archivedAt?: string;
}

export interface ActiveTodoResponse {
  week: TodoWeek;
  nodes: TodoNode[];
}

export interface WeekDetailResponse {
  week: TodoWeek;
  nodes: TodoNode[];
  readonly: boolean;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface CompletedTaskItem {
  _id: string;
  text: string;
  completedAt: string;
  parentId: string | null;
  parentText: string | null;
}

export interface CreatedTaskItem {
  _id: string;
  text: string;
  createdAt: string;
  parentId: string | null;
  parentText: string | null;
}

export interface DayActivity {
  completed: CompletedTaskItem[];
  created: CreatedTaskItem[];
}

export interface FlatTodoItem extends TodoNode {
  displayIndex: number;
  depth: number;
  hasChildren: boolean;
  childCount: number;
}

export function flattenTodoTree(
  nodes: TodoNode[],
  collapsedIds: Set<string> = new Set()
): FlatTodoItem[] {
  const childrenMap = new Map<string, TodoNode[]>();

  nodes.forEach((node) => {
    const key = node.parentId || '__root__';
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(node);
  });

  childrenMap.forEach((list) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  });

  const displayIndexById = new Map<string, number>();
  // 记录所有能从根节点经父子链到达的节点。被折叠隐藏的子节点仍属于此集合，
  // 用于区分"折叠隐藏"与"真正的孤儿节点"。
  const rootConnected = new Set<string>();
  let nextDisplayIndex = 0;

  const assignDisplayIndices = (parentId: string | null) => {
    const key = parentId || '__root__';
    const children = childrenMap.get(key) || [];
    children.forEach((node) => {
      nextDisplayIndex += 1;
      displayIndexById.set(node._id, nextDisplayIndex);
      rootConnected.add(node._id);
      assignDisplayIndices(node._id);
    });
  };

  assignDisplayIndices(null);

  nodes
    .filter((node) => !displayIndexById.has(node._id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
    .forEach((node) => {
      nextDisplayIndex += 1;
      displayIndexById.set(node._id, nextDisplayIndex);
    });

  const result: FlatTodoItem[] = [];

  const walkVisible = (parentId: string | null, depth: number) => {
    const key = parentId || '__root__';
    const children = childrenMap.get(key) || [];
    children.forEach((node) => {
      const descendants = childrenMap.get(node._id) || [];
      const hasChildren = descendants.length > 0;
      result.push({
        ...node,
        displayIndex: displayIndexById.get(node._id)!,
        depth,
        hasChildren,
        childCount: descendants.length,
      });
      if (hasChildren && collapsedIds.has(node._id)) {
        return;
      }
      walkVisible(node._id, depth + 1);
    });
  };

  walkVisible(null, 0);

  // 仅补充"真正的孤儿节点"（父链无法回到根）。被折叠隐藏的子节点属于 rootConnected，
  // 不应在此被当作顶层项重新追加，否则收起父任务后其子任务会漏到列表外平铺显示。
  const included = new Set(result.map((item) => item._id));
  nodes
    .filter((node) => !included.has(node._id) && !rootConnected.has(node._id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
    .forEach((node) => {
      result.push({
        ...node,
        displayIndex: displayIndexById.get(node._id)!,
        depth: 0,
        hasChildren: (childrenMap.get(node._id) || []).length > 0,
        childCount: (childrenMap.get(node._id) || []).length,
      });
    });

  return result;
}

export async function fetchActiveTodos(): Promise<ActiveTodoResponse> {
  const result = await apiRequest('/todo/active');
  return result.data;
}

export async function fetchWeeks(): Promise<TodoWeek[]> {
  const result = await apiRequest('/todo/weeks');
  return result.data || [];
}

export async function fetchWeekDetail(weekKey: string): Promise<WeekDetailResponse> {
  const result = await apiRequest(`/todo/weeks/${weekKey}`);
  return result.data;
}

export async function fetchDailyStats(from?: string, to?: string): Promise<DailyStat[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const result = await apiRequest(`/todo/stats/daily${query ? `?${query}` : ''}`);
  return result.data || [];
}

export async function fetchCompletedByDate(date: string): Promise<CompletedTaskItem[]> {
  const result = await apiRequest(`/todo/completed?date=${encodeURIComponent(date)}`);
  return result.data || [];
}

export async function fetchDayActivity(date: string): Promise<DayActivity> {
  const result = await apiRequest(`/todo/day?date=${encodeURIComponent(date)}`);
  return result.data || { completed: [], created: [] };
}

export async function createTodoNode(text: string, parentId?: string | null): Promise<TodoNode> {
  const result = await apiRequest('/todo/nodes', {
    method: 'POST',
    body: JSON.stringify({ text: text.trim(), parentId: parentId || null }),
  });
  return result.data;
}

export async function updateTodoNode(
  id: string,
  payload: { text?: string; completed?: boolean }
): Promise<TodoNode> {
  const result = await apiRequest(`/todo/nodes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function moveTodoNode(
  id: string,
  payload: { parentId?: string | null; sortOrder?: number; afterId?: string }
): Promise<TodoNode> {
  const result = await apiRequest(`/todo/nodes/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return result.data;
}

export async function deleteTodoNode(id: string): Promise<void> {
  await apiRequest(`/todo/nodes/${id}`, { method: 'DELETE' });
}
