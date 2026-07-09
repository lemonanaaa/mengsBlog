import hljs from 'highlight.js';

/**
 * 将文本转为 URL-friendly slug
 * 小写化、空格转 -、保留字母数字与中日韩字符
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 为缺少 id 的 heading 元素注入 slug id（幂等）
 * 已有 id 的 heading 保留不覆盖
 */
export function injectHeadingIds(root: HTMLElement): void {
  const seen = new Set<string>();
  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6');
  headings.forEach((h) => {
    if (h.id) {
      seen.add(h.id);
      return;
    }
    const base = slugify(h.textContent ?? '');
    let id = base || 'section';
    let n = 1;
    while (seen.has(id)) {
      id = `${base || 'section'}-${n++}`;
    }
    h.id = id;
    seen.add(id);
  });
}

/**
 * 在每个 H2/H3/H4 标题后插入锚点复制按钮（幂等 additive mutation）
 * - 跳过无 id 的节点
 * - 下一个 sibling 已是 .heading-anchor 时跳过（幂等 guard）
 * - 不修改 heading 自身的 innerHTML / attributes / children
 */
export function injectHeadingAnchors(root: HTMLElement): void {
  const headings = root.querySelectorAll('h1, h2, h3, h4');
  headings.forEach((heading) => {
    if (!heading.id) return;
    // 幂等 guard：末尾已是 .heading-anchor 则跳过
    const last = heading.lastElementChild;
    if (last && last.classList.contains('heading-anchor')) return;
    // 追加到标题内部末尾，使锚点内联跟在标题文字后面
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'heading-anchor';
    btn.setAttribute('data-anchor', heading.id);
    btn.setAttribute('aria-label', '复制链接');
    btn.textContent = '\uD83D\uDD17';
    heading.appendChild(btn);
  });
}

/**
 * 给 H2/H3/H4 标题标记为可折叠（幂等）
 * - 添加 collapsible-heading class（用于 CSS 箭头与 cursor）
 * - 初始 data-collapsed="false"（默认全部展开）
 * - 不修改 heading 自身的 innerHTML / 文本 / 子节点
 */
export function injectSectionToggles(root: HTMLElement): void {
  const headings = root.querySelectorAll('h1, h2, h3, h4');
  headings.forEach((h) => {
    const el = h as HTMLElement;
    if (!el.classList.contains('collapsible-heading')) {
      el.classList.add('collapsible-heading');
    }
    if (el.getAttribute('data-collapsed') === null) {
      el.setAttribute('data-collapsed', 'false');
    }
  });
}

const HEADING_RE = /^H([1-6])$/;

/**
 * 根据每个标题的 data-collapsed 状态，重新计算并应用正文内容的可见性。
 * 规则：
 * - 某标题 data-collapsed="true" 时，其"整节内容"（后续兄弟节点，直到遇到
 *   level <= 当前标题 level 的下一个标题为止，含嵌套的子标题及其内容）被隐藏。
 * - 标题自身的锚点按钮 (.heading-anchor) 跟随该标题的可见性。
 * - 支持嵌套：若父级 H2 折叠，其下所有 H3/H4 及内容都隐藏，即使 H3 自身是展开的。
 * 纯 DOM mutation，幂等（可反复调用得到一致结果）。
 */
export function applyCollapseState(root: HTMLElement): void {
  const kids = Array.from(root.children) as HTMLElement[];
  // 记录当前"处于折叠中的祖先标题"的 level 栈
  const collapsedStack: number[] = [];

  for (const el of kids) {
    const m = HEADING_RE.exec(el.tagName);
    if (m) {
      const level = Number(m[1]);
      // 退出所有 level >= 当前的已折叠祖先
      while (
        collapsedStack.length &&
        collapsedStack[collapsedStack.length - 1] >= level
      ) {
        collapsedStack.pop();
      }
      const hidden = collapsedStack.length > 0;
      el.classList.toggle('section-hidden', hidden);
      // 若本标题自身处于折叠状态，压栈（其后内容将被隐藏）
      if (el.getAttribute('data-collapsed') === 'true') {
        collapsedStack.push(level);
      }
    } else {
      const hidden = collapsedStack.length > 0;
      el.classList.toggle('section-hidden', hidden);
    }
  }
}

/**
 * 切换某个标题的折叠状态并重新应用可见性
 */
export function toggleHeadingCollapse(root: HTMLElement, heading: HTMLElement): void {
  const cur = heading.getAttribute('data-collapsed') === 'true';
  heading.setAttribute('data-collapsed', cur ? 'false' : 'true');
  applyCollapseState(root);
}

/**
 * 对所有 pre > code 节点应用 highlight.js 高亮（幂等）
 * - 跳过已带 hljs class 的节点
 * - 保留已有的 language-* class
 * - 单个节点高亮失败不外抛
 */
export function highlightPreCodeElements(root: HTMLElement): void {
  const nodes = root.querySelectorAll('pre > code');
  nodes.forEach((code) => {
    const el = code as HTMLElement;
    if (el.classList.contains('hljs')) return;
    try {
      hljs.highlightElement(el);
    } catch {
      // 保证坏片段不外抛
    }
  });
}
