import { apiRequest } from '../../config/api';

export type TodoGroup = 'today' | 'later';

export interface TodoItem {
  _id: string;
  text: string;
  completed: boolean;
  group: TodoGroup;
  createdAt: string;
  updatedAt: string;
}

export async function fetchTodos(): Promise<TodoItem[]> {
  const result = await apiRequest('/todos');
  return result.data || [];
}

export async function addTodo(text: string, group: TodoGroup): Promise<TodoItem> {
  const result = await apiRequest('/todos', {
    method: 'POST',
    body: JSON.stringify({ text: text.trim(), group }),
  });
  return result.data;
}

export async function toggleTodo(id: string, completed: boolean): Promise<TodoItem> {
  const result = await apiRequest(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
  return result.data;
}

export async function removeTodo(id: string): Promise<void> {
  await apiRequest(`/todos/${id}`, { method: 'DELETE' });
}

export async function clearCompleted(group: TodoGroup): Promise<void> {
  await apiRequest(`/todos/completed/${group}`, { method: 'DELETE' });
}
