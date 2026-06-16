import React, { useState, useEffect, useCallback } from "react";
import { Spin, message } from "antd";
import Layout from "../common/Layout";
import {
  TodoItem,
  TodoGroup,
  fetchTodos,
  addTodo,
  toggleTodo,
  removeTodo,
  clearCompleted,
} from "./api";
import "../../css/todo/todo.css";

const GROUP_CONFIG: { key: TodoGroup; title: string; icon: string }[] = [
  { key: "today", title: "今日待办", icon: "☀️" },
  { key: "later", title: "以后待办", icon: "📌" },
];

const TodoGroupSection = ({
  group,
  title,
  icon,
  items,
  loading,
  onToggle,
  onDelete,
  onAdd,
  onClearCompleted,
}: {
  group: TodoGroup;
  title: string;
  icon: string;
  items: TodoItem[];
  loading: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, group: TodoGroup) => void;
  onClearCompleted: (group: TodoGroup) => void;
}) => {
  const [input, setInput] = useState("");
  const activeCount = items.filter((t) => !t.completed).length;
  const completedCount = items.filter((t) => t.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    onAdd(text, group);
    setInput("");
  };

  return (
    <section className="todo-group">
      <div className="todo-group-header">
        <h2 className="todo-group-title">
          <span>{icon}</span>
          <span>{title}</span>
          {items.length > 0 && (
            <span className="todo-group-count">
              {activeCount} 项待完成
            </span>
          )}
        </h2>
        {completedCount > 0 && (
          <button
            type="button"
            className="todo-clear-completed"
            onClick={() => onClearCompleted(group)}
            disabled={loading}
          >
            清除已完成 ({completedCount})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="todo-empty">暂无事项，添加一个吧</p>
      ) : (
        <ul className="todo-list">
          {items.map((item) => (
            <li
              key={item._id}
              className={`todo-item${item.completed ? " completed" : ""}`}
            >
              <button
                type="button"
                className="todo-checkbox"
                onClick={() => onToggle(item._id, item.completed)}
                disabled={loading}
                aria-label={item.completed ? "标记未完成" : "标记完成"}
              >
                {item.completed ? "✓" : ""}
              </button>
              <span className="todo-text">{item.text}</span>
              <button
                type="button"
                className="todo-delete"
                onClick={() => onDelete(item._id)}
                disabled={loading}
                aria-label="删除"
                title="删除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="todo-add-form" onSubmit={handleSubmit}>
        <input
          className="todo-add-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="添加新事项…"
          disabled={loading}
        />
        <button
          className="todo-add-btn"
          type="submit"
          disabled={!input.trim() || loading}
        >
          添加
        </button>
      </form>
    </section>
  );
};

const TodoView = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (error) {
      console.error("加载待办失败:", error);
      message.error("加载待办失败，请确认后端服务已启动");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleToggle = async (id: string, completed: boolean) => {
    setActionLoading(true);
    try {
      const updated = await toggleTodo(id, !completed);
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? updated : t))
      );
    } catch (error) {
      console.error("更新待办失败:", error);
      message.error("操作失败，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await removeTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("删除待办失败:", error);
      message.error("删除失败，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async (text: string, group: TodoGroup) => {
    setActionLoading(true);
    try {
      const created = await addTodo(text, group);
      setTodos((prev) => [created, ...prev]);
    } catch (error) {
      console.error("添加待办失败:", error);
      message.error("添加失败，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCompleted = async (group: TodoGroup) => {
    setActionLoading(true);
    try {
      await clearCompleted(group);
      setTodos((prev) =>
        prev.filter((t) => t.group !== group || !t.completed)
      );
      message.success("已清除已完成事项");
    } catch (error) {
      console.error("清除已完成失败:", error);
      message.error("清除失败，请稍后重试");
    } finally {
      setActionLoading(false);
    }
  };

  const isBusy = loading || actionLoading;

  return (
    <Layout>
      <div className="todo-page">
        <h1>每日待办</h1>
        <p className="todo-subtitle">
          记录今天要做的和以后想做的，数据保存在 MongoDB 数据库，多设备同步可用。
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="加载中…" />
          </div>
        ) : (
          GROUP_CONFIG.map(({ key, title, icon }) => (
            <TodoGroupSection
              key={key}
              group={key}
              title={title}
              icon={icon}
              items={todos.filter((t) => t.group === key)}
              loading={isBusy}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAdd={handleAdd}
              onClearCompleted={handleClearCompleted}
            />
          ))
        )}
      </div>
    </Layout>
  );
};

export default TodoView;
