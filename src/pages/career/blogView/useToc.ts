import { useState, useEffect } from 'react';

export interface TocEntry {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
}

export interface TocTreeNode extends TocEntry {
  children: TocTreeNode[];
}

/**
 * 从渲染后的 DOM 中提取 H1/H2/H3/H4 标题构建 flat 目录列表
 * 跳过无 id 的节点
 */
export function extractToc(root: HTMLElement): TocEntry[] {
  const nodes = root.querySelectorAll('h1, h2, h3, h4');
  const out: TocEntry[] = [];
  nodes.forEach((n) => {
    if (!n.id) return;
    const level = Number(n.tagName.substring(1)) as 1 | 2 | 3 | 4;
    // 排除标题内注入的锚点按钮文本（🔗），只取标题本身文字
    let text = '';
    n.childNodes.forEach((child) => {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as HTMLElement).classList.contains('heading-anchor')
      ) {
        return;
      }
      text += child.textContent ?? '';
    });
    out.push({ id: n.id, text: text.trim(), level });
  });
  return out;
}

/**
 * 将 flat TocEntry[] 构建为嵌套 TocTreeNode[]
 * H1 → 顶层；H2 → 最近 H1 子节点（无 H1 时提升顶层）；
 * H3 → 最近 H2 子节点（回退 H1，再回退顶层）；
 * H4 → 最近 H3 子节点（回退 H2，再回退 H1，最终回退顶层）
 */
export function buildTocTree(entries: TocEntry[]): TocTreeNode[] {
  const roots: TocTreeNode[] = [];
  let currentH1: TocTreeNode | null = null;
  let currentH2: TocTreeNode | null = null;
  let currentH3: TocTreeNode | null = null;

  const attach = (node: TocTreeNode, ...parents: (TocTreeNode | null)[]) => {
    const parent = parents.find((p) => p !== null) ?? null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  };

  for (const e of entries) {
    const node: TocTreeNode = { ...e, children: [] };
    if (e.level === 1) {
      roots.push(node);
      currentH1 = node;
      currentH2 = null;
      currentH3 = null;
    } else if (e.level === 2) {
      attach(node, currentH1);
      currentH2 = node;
      currentH3 = null;
    } else if (e.level === 3) {
      attach(node, currentH2, currentH1);
      currentH3 = node;
    } else {
      // level === 4
      attach(node, currentH3, currentH2, currentH1);
    }
  }
  return roots;
}

/**
 * 从可见标题中选择 active 条目（boundingClientRect.top 最小的）
 */
export function selectActiveEntry(
  visible: HTMLElement[],
  prevActive: string | null
): string | null {
  if (visible.length === 0) return prevActive;
  const top = visible.reduce((a, b) =>
    a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b
  );
  return top.id;
}

/**
 * TOC hook：提取目录条目 + IntersectionObserver 追踪 activeId
 */
export function useToc(
  bodyRef: React.RefObject<HTMLElement>,
  contentKey: string
) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // content 变化时刷新 entries
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setEntries(extractToc(el));
  }, [bodyRef, contentKey]);

  // IntersectionObserver 追踪可见标题
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || entries.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const targets = entries
      .map((e) => el.querySelector<HTMLElement>(`#${CSS.escape(e.id)}`))
      .filter((x): x is HTMLElement => !!x);

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .map((r) => r.target as HTMLElement);
        setActiveId((prev) => selectActiveEntry(visible, prev));
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [entries, bodyRef]);

  return { entries, activeId };
}
