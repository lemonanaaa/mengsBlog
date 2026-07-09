import React, { useState, useMemo } from 'react';
import { TocEntry, TocTreeNode, buildTocTree } from './useToc';

interface TocPanelProps {
  entries: TocEntry[];
  activeId: string | null;
}

// 点击目录跳转时，目标标题距视口顶部保留的间距（不贴顶）
const SCROLL_OFFSET = 100;

function scrollToHeadingWithFlash(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
  // 重启闪烁动画：先移除、强制回流、再添加
  el.classList.remove('heading-flash');
  el.getBoundingClientRect(); // 强制回流以重启动画
  el.classList.add('heading-flash');
  window.setTimeout(() => el.classList.remove('heading-flash'), 2000);
}

export function TocPanel({ entries, activeId }: TocPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildTocTree(entries), [entries]);

  if (tree.length === 0) return null;

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: TocTreeNode) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
      <li key={node.id} className={`toc-node toc-level-${node.level}`}>
        <div className="toc-row">
          {hasChildren ? (
            <button
              type="button"
              className="toc-toggle"
              aria-label={isCollapsed ? '展开' : '折叠'}
              aria-expanded={!isCollapsed}
              onClick={() => toggle(node.id)}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          ) : (
            <span className="toc-toggle toc-toggle--leaf" aria-hidden="true" />
          )}
          <a
            href={`#${node.id}`}
            className={`toc-link${activeId === node.id ? ' is-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeadingWithFlash(node.id);
            }}
          >
            {node.text}
          </a>
        </div>
        {hasChildren && !isCollapsed && (
          <ul className="toc-children">{node.children.map(renderNode)}</ul>
        )}
      </li>
    );
  };

  return (
    <nav className="toc-panel" aria-label="Table of contents">
      <ul className="toc-root">{tree.map(renderNode)}</ul>
    </nav>
  );
}
