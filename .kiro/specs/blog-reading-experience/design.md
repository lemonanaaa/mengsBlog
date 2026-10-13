# Design Document

## Overview

本设计在**不改动博客数据模型**的前提下，从两个方向升级博客系统：

1. **编辑侧（wangEditor 单一路径）**：博客内容仍以 HTML 字符串存储。仅对现有 `editBlogs/View.tsx` 内 wangEditor 的两处配置做加强 —— `toolbarConfig` 显式列出面试复习整理所需的按钮集合（Requirement 1），`editorConfig.MENU_CONF.uploadImage.customUpload` 注入统一的图片上传函数（Requirement 2）。wangEditor 本身对图片按钮点击、剪贴板粘贴、拖拽三种触发路径已在内部收敛到同一个 `customUpload` 钩子，因此三条触发方式只需一个入口即可覆盖。
2. **阅读侧（单渲染路径 + 阅读辅助层）**：博客正文永远由 `dangerouslySetInnerHTML` 直接渲染 HTML（与升级前完全一致），随后由一个 `useEffect` 跑两步 DOM 后处理 —— `injectHeadingIds` 与 `highlightPreCodeElements`（Requirement 3, 4）。围绕这块渲染区域叠加 TOC、进度条、字号/主题偏好等阅读辅助组件（Requirement 3, 5, 6），全部通过 CSS 变量 + `data-*` 属性驱动。

不可动摇的约束：

- **字节级向后兼容**：任一历史 HTML 博客的 `innerHTML` 在升级后与升级前一致；数据不迁移、字段不新增。
- **单一 API 通道**：所有前后端交互继续走 `blogApiRequest`，鉴权仍由 `?meng=true` 决定；新增的图片上传接口是新增能力，不改既有接口。
- **样式流水线不变**：新增 / 修改的 CSS 通过 `npx gulp styles` 编译。

本次同时增补三块**纯前端阅读辅助能力**（Requirement 7 / 8 / 9）：**BackToTopButton**（悬浮返回顶部按钮）、**LastReadPosition**（按博客 id 记忆上次阅读位置并在下次打开时自动恢复）、**HeadingAnchor**（标题旁的锚点复制控件）。三者都只在阅读侧生效，不改后端接口、不新增数据库字段、不改变 wangEditor 输出的 HTML 字节内容 —— HeadingAnchor 是一次 **additive DOM mutation**（在 heading 元素**之后**插入 sibling 节点，不修改 heading 自身的 innerHTML）。

## Architecture

### High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                                                                  │
│  editBlogs/View.tsx  (already exists — extended in place)        │
│    ├── toolbarConfig  =  { toolbarKeys: [...11 keys] }           │
│    └── editorConfig.MENU_CONF.uploadImage.customUpload           │
│              └── uploadBlogImage(file)  ──▶ insert(url)          │
│                                                                  │
│  career/blogView/View.tsx  (extended)                            │
│    └── ReaderPreferencesProvider  (Context + localStorage)       │
│        └── ReaderLayout  (3-col grid; Drawer on mobile)          │
│              ├── ReadingProgressBar   (window scroll ratio)      │
│              ├── ReaderToolbar        (font size + light/dark)   │
│              ├── BlogNavPanel (left)  (existing blog nav / TOF)  │
│              ├── BlogContentRenderer  (center) ────┐             │
│              │      ├── dangerouslySetInnerHTML     │             │
│              │      ├── useEffect (post-render):    │             │
│              │      │     injectHeadingIds          │             │
│              │      │     injectHeadingAnchors      │             │
│              │      │     highlightPreCodeElements  │             │
│              │      └── HeadingAnchorHandler        │             │
│              │            (event-delegated click on │             │
│              │             .heading-anchor)         │             │
│              ├── TocPanel (right)  ─────────────────┘             │
│              │     ├── useToc(bodyRef) → entries + activeId       │
│              │     └── IntersectionObserver on h2/h3              │
│              ├── BackToTopButton   (fixed, right)                 │
│              │     └── useScrollThreshold(vh * 0.5)               │
│              └── LastReadTracker   (headless — no UI)             │
│                    └── useLastReadPosition(blogId)                │
│                          ├── useScrollRecorder (debounced write)  │
│                          └── useRestoreScrollPosition             │
│                                                                  │
│  config/api.ts  (extended)                                       │
│    └── uploadBlogImage(file)  (multipart wrapper)                │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTP (JSON / multipart)
┌─────────────────────────────▼────────────────────────────────────┐
│                     Backend (Node + Mongo)                       │
│                                                                  │
│  routes/blogs.js                                                 │
│    ├── (existing) GET /api/blogs/:id, POST/PUT /api/blogs        │
│    └── POST /api/blogs/upload-image  (multer, image only)        │
│                                                                  │
│  uploads/blogs/<yyyy-MM-dd>/<uuid>.<ext>   (new static dir)      │
└──────────────────────────────────────────────────────────────────┘
```

### Rendering Pipeline (Reader) — single path

```
Blog JSON  (content: HTML string)
   │
   ▼
BlogContentRenderer
   │
   ├── dangerouslySetInnerHTML={{ __html: blog.content }}
   │       (byte-identical to legacy behavior)
   │
   └── useEffect(after render):
         1) injectHeadingIds(rootEl)          // idempotent: only fills empty ids
         2) injectHeadingAnchors(rootEl)      // idempotent additive: adds .heading-anchor sibling after each h2/h3/h4
         3) highlightPreCodeElements(rootEl)  // idempotent: skips existing hljs
         // ordering is significant: (2) needs the id values written by (1),
         // and (3) touches only <code> nodes so it commutes with (2).
   │
   ▼
useToc(bodyRef)         ─▶ TocPanel      + IntersectionObserver
useReadingProgress()    ─▶ ReadingProgressBar
ReaderPreferencesProvider ─▶ ReaderToolbar (data-theme, data-font-size)
```

### Editor Pipeline — single path

```
Editor mount (editBlogs/View.tsx)
   │
   ├── toolbarConfig.toolbarKeys = [ headerSelect, bold, italic,
   │                                 bulletedList, numberedList,
   │                                 code, codeBlock, blockquote,
   │                                 insertLink, insertImage, insertTable ]
   │
   └── editorConfig.MENU_CONF.uploadImage.customUpload =
         async (file, insert) => {
             const { url } = await uploadBlogImage(file);
             insert(url);
         }
        // wangEditor pipes button click, paste, and drop into this
        // single hook, so all three trigger paths share the same
        // upload flow with no extra wiring on our side.

Save
   │
   ▼
blogApiRequest(POST|PUT /blogs, { title, content, summary, status, tags, isFeatured })
   // content is always an HTML string; no new fields.
```

## Data Model

### Backend

No schema changes. The Blog model remains as-is. No migration required.

### Frontend Types

Only additive types for the reader preferences slice; the existing `Blog` shape is not touched (its runtime is a plain object destructured in place).

```typescript
// src/pages/career/blogView/types.ts  (new file)
export type FontSize = 'sm' | 'md' | 'lg';
export type Theme = 'light' | 'dark';

export interface ReaderPreferences {
  fontSize: FontSize;
  theme: Theme;
}

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  fontSize: 'md',
  theme: 'light',
};

export const READER_PREFS_STORAGE_KEY = 'blog-reader-preferences';

export function isValidPreferences(x: unknown): x is ReaderPreferences {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    (p.fontSize === 'sm' || p.fontSize === 'md' || p.fontSize === 'lg') &&
    (p.theme === 'light' || p.theme === 'dark')
  );
}
```

`isValidPreferences` is a hand-rolled predicate (no Zod dependency) that is both the storage validator and the property test's oracle.

## API Contracts

### 1. Blog CRUD (unchanged)

`POST /api/blogs`, `PUT /api/blogs/:id`, `GET /api/blogs/:id` retain their current request / response shapes. The request body carries `{ title, content, summary, status, isFeatured, tags }`; `content` is an HTML string. **No `contentType` field is introduced anywhere.**

### 2. Blog Image Upload (new)

A dedicated endpoint, deliberately separate from `/api/photos/upload`:

- `/api/photos/upload` writes to the photography collection and produces Photo documents. Blog inline images should not appear as photos.
- A dedicated endpoint gives us a clean storage subdirectory that is easy to back up / clean up separately.
- The response shape is minimal (`{ url }`), simpler than the Photo model.

```
POST /api/blogs/upload-image
Content-Type: multipart/form-data
Field: file  (single image)

Response 200:
{
  "success": true,
  "data": { "url": "/uploads/blogs/2025-01-15/abc123.png" }
}

Response 400 (non-image mime / oversized file):
{ "success": false, "message": "Only image files are allowed" }
  or
{ "success": false, "message": "File exceeds 5MB limit" }

Response 401 (meng-mode auth failure, if enforced server-side):
{ "success": false, "message": "Unauthorized" }
```

**Storage rules:**

- MIME whitelist: `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml`.
- Max size: 5 MB (multer `limits.fileSize`).
- Storage layout: `uploads/blogs/<yyyy-MM-dd>/<uuid>.<ext>` where `<ext>` is derived from the sniffed MIME.
- Server exposes `uploads/blogs/` as a static route (same pattern as existing `uploads/`).

### 3. Frontend API Helper

`src/config/api.ts` gains one helper (does not alter existing `blogApiRequest`):

```typescript
export async function uploadBlogImage(file: File): Promise<{ url: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  const url = `${API_CONFIG.BLOG_BASE_URL}/blogs/upload-image`;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json?.success || !json?.data?.url) {
    throw new Error('Upload failed: malformed response');
  }
  return { url: json.data.url };
}
```

`uploadBlogImage` deliberately does not go through `blogApiRequest`, because that helper forces `Content-Type: application/json`. It reuses the same base URL and preserves the same success envelope contract.

## Frontend Component Design

### 1. Editor Changes (in-place, no new components)

The current `editBlogs/View.tsx` already mounts wangEditor. We only rewrite the two config objects; no component extraction is introduced.

```typescript
import { uploadBlogImage } from '../../config/api';

// Explicit toolbar keys so Requirement 1's set of capabilities is guaranteed
// regardless of any future default-list changes upstream.
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',   // H1 / H2 / H3 / H4 dropdown  (Req 1.1)
    'bold',           // Req 1.2
    'italic',         // Req 1.2
    'bulletedList',   // Req 1.3
    'numberedList',   // Req 1.3
    'code',           // inline code  (Req 1.5)
    'codeBlock',      // fenced code block  (Req 1.4)
    'blockquote',     // Req 1.6
    'insertLink',     // Req 1.8
    'insertImage',    // Req 1.7
    'insertTable',    // Req 1.9
  ],
};

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      // wangEditor pipes the toolbar image button, container paste events,
      // and container drop events all through this single hook.  We do not
      // need our own paste/drop listeners on top.
      customUpload: async (file: File, insertFn: (url: string) => void) => {
        try {
          const { url } = await uploadBlogImage(file);
          insertFn(url);
        } catch (err: any) {
          message.error(err?.message || '图片上传失败');
          // Deliberately do NOT call insertFn on failure  (Req 2.6)
        }
      },
    },
  },
};
```

**Why we do not add our own paste / drop listeners:**

wangEditor internally routes clipboard paste of image data and file drop into its `uploadImage` pipeline, which then calls `customUpload`. Adding container-level listeners would either duplicate uploads (both wangEditor and our listener firing) or require us to `preventDefault` on wangEditor's own handling. Keeping the single `customUpload` hook is both simpler and matches Req 2.1 by construction.

**Language class preservation (Req 1.10):**

When the author picks a language for a code block, wangEditor writes `<code class="language-<lang>">` into the output HTML. Because our reader pipeline never rewrites `<code>` element attributes (see `highlightPreCodeElements` below), the class survives the round-trip unchanged.

### 2. `BlogContentRenderer`

Location: `src/pages/career/blogView/BlogContentRenderer.tsx` (new)

Single rendering path — always HTML.

```typescript
interface Props {
  content: string;
  bodyRef: React.RefObject<HTMLDivElement>;
}

export function BlogContentRenderer({ content, bodyRef }: Props) {
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    injectHeadingIds(el);
    highlightPreCodeElements(el);
  }, [content, bodyRef]);

  return (
    <article
      ref={bodyRef}
      className="blog-article"
      // byte-identical to the pre-upgrade rendering path
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
```

Notes:

- `bodyRef` is owned by the parent (`BlogView`) so that `useToc` and other observers can address the very same DOM subtree.
- The post-render pass is additive and idempotent: `injectHeadingIds` only fills `id`s where absent; `highlightPreCodeElements` only calls `hljs.highlightElement` on `<code>` nodes that do not already carry an `hljs` class.
- No content is ever produced by React inside `<article>` beyond what `dangerouslySetInnerHTML` writes; that gives us the byte-level backward-compat guarantee.

### 3. DOM Post-Processing Helpers

Location: `src/pages/career/blogView/postRender.ts` (new)

```typescript
export function injectHeadingIds(root: HTMLElement): void {
  const seen = new Set<string>();
  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6');
  headings.forEach((h) => {
    if (h.id) { seen.add(h.id); return; }
    const base = slugify(h.textContent ?? '');
    let id = base || 'section';
    let n = 1;
    while (seen.has(id)) { id = `${base || 'section'}-${n++}`; }
    h.id = id;
    seen.add(id);
  });
}

export function highlightPreCodeElements(root: HTMLElement): void {
  const nodes = root.querySelectorAll('pre > code');
  nodes.forEach((code) => {
    const el = code as HTMLElement;
    if (el.classList.contains('hljs')) return;    // idempotent guard
    try {
      hljs.highlightElement(el);                  // preserves language-* class
    } catch {
      // Req 4.3: never throw upward from a bad code fragment.
    }
  });
}
```

`hljs.highlightElement` internally reads the `language-<lang>` class to pick a language and preserves that class on the element (it only adds `hljs` and `language-<lang>` where absent; it never removes them). That is the mechanism by which Req 1.10 + Req 4.4 hold as one property.

### 4. `TocPanel` + `useToc`

Location: `src/pages/career/blogView/{TocPanel.tsx, useToc.ts}` (new)

**Data-shape choice — flat list + separate `buildTocTree` builder.**

We keep the extraction output as a flat, document-ordered array (`TocEntry[]`) and introduce a **separate pure function** `buildTocTree(entries)` that assembles the nested tree used for rendering. Rationale:

- `useToc` needs a flat sequence for `IntersectionObserver` (which observes leaf DOM nodes without knowing about parent/child nesting) and for `selectActiveEntry` (which reduces over visible headings).
- The tree shape is a rendering concern; keeping it out of `extractToc` keeps that function a straightforward one-to-one map of DOM headings.
- Both functions stay independently, cheaply testable: `extractToc` verifies DOM → flat, `buildTocTree` verifies flat → nested. Neither owns collapse state; that lives inside `TocPanel`.

```typescript
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

export interface TocTreeNode extends TocEntry {
  children: TocTreeNode[];
}

export function extractToc(root: HTMLElement): TocEntry[] {
  const nodes = root.querySelectorAll('h2, h3, h4');
  const out: TocEntry[] = [];
  nodes.forEach((n) => {
    if (!n.id) return;                       // unreachable heading, skip
    const level = (n.tagName === 'H2' ? 2 : n.tagName === 'H3' ? 3 : 4) as 2 | 3 | 4;
    out.push({ id: n.id, text: n.textContent ?? '', level });
  });
  return out;
}

// Flat, document-ordered TocEntry[]  →  nested TocTreeNode[]
// - H2 becomes a top-level node.
// - H3 attaches to the most recent H2 seen; if no H2 has been seen yet
//   the H3 is promoted to top level (fallback).
// - H4 attaches to the most recent H3 under the current H2; if no such
//   H3 exists (H2 → H4 skip, or no H2 at all) the H4 attaches to the
//   nearest available top-level container (current H2 if any, else
//   promoted to top level).
// Pure function: no DOM, no state, no side effects.
export function buildTocTree(entries: TocEntry[]): TocTreeNode[] {
  const roots: TocTreeNode[] = [];
  let currentH2: TocTreeNode | null = null;
  let currentH3: TocTreeNode | null = null;

  for (const e of entries) {
    const node: TocTreeNode = { ...e, children: [] };
    if (e.level === 2) {
      roots.push(node);
      currentH2 = node;
      currentH3 = null;
    } else if (e.level === 3) {
      if (currentH2) {
        currentH2.children.push(node);
      } else {
        roots.push(node);          // fallback: no H2 ancestor
      }
      currentH3 = node;
    } else {
      // level === 4
      if (currentH3) {
        currentH3.children.push(node);
      } else if (currentH2) {
        currentH2.children.push(node);   // fallback: skipped H3
      } else {
        roots.push(node);                // fallback: no ancestor at all
      }
    }
  }
  return roots;
}

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

export function useToc(bodyRef: React.RefObject<HTMLElement>, contentKey: string) {
  const [entries, setEntries] = useState<TocEntry[]>([]);       // flat
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setEntries(extractToc(el));
  }, [bodyRef, contentKey]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || entries.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return; // graceful degradation
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
  }, [entries]);

  return { entries, activeId };
}
```

**`TocPanel` — nested rendering with collapse state.**

```typescript
interface TocPanelProps {
  entries: TocEntry[];
  activeId: string | null;
}

export function TocPanel({ entries, activeId }: TocPanelProps) {
  // Collapse state lives entirely inside TocPanel — it never leaks back
  // into useToc / extractToc / selectActiveEntry.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildTocTree(entries), [entries]);

  if (tree.length === 0) return null;   // Req 3.6 — legacy blogs w/o headings

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
              document.getElementById(node.id)
                ?.scrollIntoView({ behavior: 'smooth' });
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
```

Key behaviors baked into the shape above:

- Initial `collapsed = new Set()` means every level is expanded on first render (Req 3.10).
- Only nodes with `children.length > 0` render an interactive `▶ / ▼` button; leaf rows render a non-interactive placeholder span for alignment only (Req 3.13).
- `toggle(id)` flips exactly one entry in `collapsed`; child rendering is short-circuited by the `!isCollapsed` guard. The active highlight (`is-active`) is applied through `activeId` regardless of collapse state (Req 3.11).
- `activeId` is computed by `useToc` from the flat `entries` and `IntersectionObserver`; it is **never** consulted by the collapse logic. If the active heading happens to live under a collapsed parent, the parent stays collapsed and no error is thrown — the highlight simply is not visible until the reader expands the parent (Req 3.12).
- If `buildTocTree` yields an empty tree the panel returns `null` and `ReaderLayout` collapses the right column via the `--no-toc` modifier (Req 3.6).

### 5. `ReadingProgressBar` + `useReadingProgress`

Location: `src/pages/career/blogView/{ReadingProgressBar.tsx, useReadingProgress.ts}` (new)

Progress is a pure function of scroll position.

```typescript
export function computeProgress(scrollTop: number, scrollMax: number): number {
  if (!Number.isFinite(scrollTop) || !Number.isFinite(scrollMax)) return 0;
  if (scrollMax <= 0) return 0;
  const raw = scrollTop / scrollMax;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}

export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollMax = doc.scrollHeight - doc.clientHeight;
      setProgress(computeProgress(scrollTop, scrollMax));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return progress;
}
```

`ReadingProgressBar` is a fixed-position `<div>` whose width is `${progress * 100}%`. We attach to the window scroll (not `bodyRef`) because the reader page's outermost scroll container is the window; the article body is not independently scrollable.

### 6. `ReaderPreferencesProvider` + `ReaderToolbar`

Location: `src/pages/career/blogView/ReaderPreferencesProvider.tsx` (new)

React Context wrapping the preferences state; on every update it writes back to `localStorage`.

```typescript
const ReaderPreferencesContext = createContext<{
  preferences: ReaderPreferences;
  setPreferences: (next: ReaderPreferences) => void;
} | null>(null);

export function ReaderPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferencesState] = useState<ReaderPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const raw = window.localStorage.getItem(READER_PREFS_STORAGE_KEY);
      if (raw == null) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(raw);
      if (isValidPreferences(parsed)) return parsed;
      window.localStorage.removeItem(READER_PREFS_STORAGE_KEY); // Req 6.6 cleanup
      return DEFAULT_PREFERENCES;
    } catch {
      // malformed JSON — treat as corrupted
      try { window.localStorage.removeItem(READER_PREFS_STORAGE_KEY); } catch {}
      return DEFAULT_PREFERENCES;
    }
  });

  const setPreferences = useCallback((next: ReaderPreferences) => {
    setPreferencesState(next);
    try {
      window.localStorage.setItem(READER_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch { /* quota / disabled storage — best-effort, session-only */ }
  }, []);

  return (
    <ReaderPreferencesContext.Provider value={{ preferences, setPreferences }}>
      <div
        className="reader-root"
        data-theme={preferences.theme}
        data-font-size={preferences.fontSize}
      >
        {children}
      </div>
    </ReaderPreferencesContext.Provider>
  );
}

export function useReaderPreferences() {
  const ctx = useContext(ReaderPreferencesContext);
  if (!ctx) throw new Error('useReaderPreferences outside provider');
  return ctx;
}
```

Because the wrapper carries the two `data-*` attributes, CSS variables reactively swap:

```css
.reader-root[data-font-size="sm"] .blog-article { font-size: 15px; line-height: 1.7; }
.reader-root[data-font-size="md"] .blog-article { font-size: 17px; line-height: 1.75; }
.reader-root[data-font-size="lg"] .blog-article { font-size: 19px; line-height: 1.8; }

.reader-root[data-theme="light"] { --bg: #fff;    --fg: #1f1f1f; --muted: #6b6b6b; }
.reader-root[data-theme="dark"]  { --bg: #1b1b1b; --fg: #e6e6e6; --muted: #a0a0a0; }
```

`ReaderToolbar` is a small control cluster (three font size buttons + a light/dark toggle) that calls `setPreferences` on each change.

### 7. `ReaderLayout`

Three-column CSS grid with responsive breakpoints:

```css
.reader-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 260px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.reader-layout--no-toc { grid-template-columns: 240px minmax(0, 1fr); }

@media (max-width: 1024px) {
  .reader-layout { grid-template-columns: minmax(0, 1fr); }
  .reader-layout__left,
  .reader-layout__right { display: none; }
}
```

On mobile, the left nav and TOC collapse into antd `Drawer`s triggered by header buttons (Req 3.3, 5.5). The `minmax(0, 1fr)` on the center column prevents the article from forcing horizontal overflow when a wide code block is present (Req 5.6); code blocks additionally receive `overflow-x: auto` in `blogView.css`.

### 8. `BackToTopButton` + `useScrollThreshold`

Location: `src/pages/career/blogView/{BackToTopButton.tsx, useScrollThreshold.ts}` (new)

Visibility is derived from a single window-scroll signal. The hook returns a plain boolean; the button is a stateless render of that boolean.

```typescript
// useScrollThreshold.ts
// Returns true iff window.scrollY >= threshold.  Defaults to half the
// viewport height (recomputed on resize).
export function useScrollThreshold(threshold?: number): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const compute = () => {
      const t = threshold ?? (window.innerHeight * 0.5);
      setIsVisible(window.scrollY >= t);
    };
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [threshold]);

  return isVisible;
}
```

```typescript
// BackToTopButton.tsx
interface Props {
  onScrollTop?: () => void;   // used by LastReadTracker to clear the record
}

export function BackToTopButton({ onScrollTop }: Props) {
  const isVisible = useScrollThreshold();
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onScrollTop?.();
  };
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="返回顶部"
      data-visible={isVisible ? 'true' : 'false'}
      onClick={handleClick}
    >
      ↑
    </button>
  );
}
```

Styling (in `backToTopButton.css`):

- Fixed positioning: `position: fixed; right: 24px; bottom: 96px;` — the `bottom: 96px` gap leaves headroom above the mobile browser chrome and prevents overlap with the right-side TOC panel on desktop (which anchors from the top).
- Visibility swap driven entirely by `data-visible`: `[data-visible="false"] { opacity: 0; pointer-events: none; }`, `[data-visible="true"] { opacity: 1; pointer-events: auto; }`, with `transition: opacity 0.2s ease`.
- Contrast in both themes: colors derived from `--bg` / `--fg` / accent CSS variables defined in `themes.css`, so the button remains legible against both light and dark backgrounds (Req 7.6).

The optional `onScrollTop` callback is the wire by which pressing the button also clears the reader's `LastReadPosition` (Req 8.7); its details live in section 9.

### 9. `useLastReadPosition(blogId)` + `LastReadTracker`

Location: `src/pages/career/blogView/{useLastReadPosition.ts, LastReadTracker.tsx}` (new)

Per-blog scroll memory. State is entirely in `localStorage`; there is no server-side round trip.

**Storage shape:**

```typescript
export interface LastReadRecord {
  headingId: string | null;   // preferred anchor; null when unknown
  scrollPercent: number;      // in [0, 1]; fallback when headingId is missing
}

export const lastReadStorageKey = (blogId: string) => `blog-last-read-${blogId}`;

export function isValidLastReadRecord(x: unknown): x is LastReadRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  const okId = r.headingId === null || typeof r.headingId === 'string';
  const okPct =
    typeof r.scrollPercent === 'number' &&
    Number.isFinite(r.scrollPercent) &&
    r.scrollPercent >= 0 &&
    r.scrollPercent <= 1;
  return okId && okPct;
}
```

`isValidLastReadRecord` mirrors the pattern already established by `isValidPreferences`: it is both the storage-time validator and the property-test oracle. No Zod dependency.

**Public hook — `useLastReadPosition(blogId)`:**

```typescript
export function useLastReadPosition(blogId: string) {
  const [record, setRecord] = useState<LastReadRecord | null>(() => readRecord(blogId));

  const saveRecord = useCallback((next: LastReadRecord) => {
    setRecord(next);
    try {
      window.localStorage.setItem(lastReadStorageKey(blogId), JSON.stringify(next));
    } catch { /* quota / disabled storage — session-only */ }
  }, [blogId]);

  const clearRecord = useCallback(() => {
    setRecord(null);
    try { window.localStorage.removeItem(lastReadStorageKey(blogId)); } catch {}
  }, [blogId]);

  return { record, saveRecord, clearRecord };
}

function readRecord(blogId: string): LastReadRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(lastReadStorageKey(blogId));
    if (raw == null) return null;
    const parsed = JSON.parse(raw);
    if (!isValidLastReadRecord(parsed)) {
      window.localStorage.removeItem(lastReadStorageKey(blogId));
      return null;
    }
    return parsed;
  } catch {
    try { window.localStorage.removeItem(lastReadStorageKey(blogId)); } catch {}
    return null;
  }
}
```

**Internal hook — `useScrollRecorder(blogId, activeId)`** (debounced writer, 500 ms):

```typescript
function useScrollRecorder(blogId: string, activeId: string | null) {
  const { saveRecord } = useLastReadPosition(blogId);
  // Use a ref for the timer so it survives re-renders (no stale closure).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    const onScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const doc = document.documentElement;
        const scrollMax = doc.scrollHeight - doc.clientHeight;
        const pct = scrollMax > 0 ? window.scrollY / scrollMax : 0;
        saveRecord({
          headingId: activeIdRef.current,
          scrollPercent: Math.min(1, Math.max(0, pct)),
        });
      }, 500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [saveRecord]);
}
```

**Internal hook — `useRestoreScrollPosition(blogId, contentReady)`** (fires exactly once when content is ready):

```typescript
function useRestoreScrollPosition(blogId: string, contentReady: boolean) {
  const { record } = useLastReadPosition(blogId);
  const didRestoreRef = useRef(false);

  useEffect(() => {
    if (!contentReady || didRestoreRef.current) return;
    didRestoreRef.current = true;

    if (!record) return;                                // Req 8.6 — no record: stay at top

    // Req 8.4 — headingId takes priority when the element exists.
    if (record.headingId) {
      const el = document.getElementById(record.headingId);
      if (el) { el.scrollIntoView(); return; }
    }
    // Req 8.5 — fallback to scroll percentage.
    const doc = document.documentElement;
    const scrollMax = doc.scrollHeight - doc.clientHeight;
    const y = record.scrollPercent * scrollMax;
    window.scrollTo(0, y);
  }, [contentReady, record]);
}
```

**Component — `LastReadTracker`** (headless):

```typescript
interface Props {
  blogId: string;
  contentReady: boolean;      // true only after injectHeadingIds has run
  activeId: string | null;    // fed from useToc
}

export function LastReadTracker({ blogId, contentReady, activeId }: Props) {
  useScrollRecorder(blogId, activeId);
  useRestoreScrollPosition(blogId, contentReady);
  return null;
}
```

**Contract with the rest of the reader:**

- `LastReadTracker` renders nothing. It is inserted inside `ReaderLayout` purely to run its two internal hooks.
- **`contentReady` gate.** The restore hook is *only* allowed to fire after `injectHeadingIds` has completed — otherwise a `headingId` lookup can race and always fail. `BlogView` sets `contentReady = true` from the same effect that runs the post-render pipeline (see section 2 update), so the ordering `injectHeadingIds → contentReady → restore` is enforced by React's effect scheduling, not by chance.
- **BackToTopButton wiring.** `BlogView` passes `onScrollTop={() => saveRecord({ headingId: null, scrollPercent: 0 })}` to `BackToTopButton` (Req 8.7). Because the same hook (`useLastReadPosition`) is used by both the tracker and the button wiring, they share the storage key and no coordination is needed.
- **Per-blog isolation.** The storage key is namespaced by `blogId`, so distinct blogs never overwrite each other's records (Req 8.8).

### 10. HeadingAnchor — `injectHeadingAnchors` + `HeadingAnchorHandler`

**Design choice: no new component file for the anchor itself.** The anchor is a plain `<button>` element inserted into the article DOM by a pure DOM function in `postRender.ts`, and click behavior is attached via **event delegation** on the `<article>` element inside `BlogContentRenderer`. This keeps HeadingAnchor consistent with `injectHeadingIds` / `highlightPreCodeElements` (a DOM pass) rather than creating a React-owned island inside the `dangerouslySetInnerHTML` subtree, which would fight React's reconciler.

**`injectHeadingAnchors(root)` — additive, idempotent DOM mutation:**

```typescript
// src/pages/career/blogView/postRender.ts  (extended)
export function injectHeadingAnchors(root: HTMLElement): void {
  const headings = root.querySelectorAll('h2, h3, h4');
  headings.forEach((h) => {
    if (!(h instanceof HTMLElement) || !h.id) return;
    // Idempotency guard: if the immediately following sibling is
    // already a .heading-anchor for this heading, do nothing.
    const next = h.nextElementSibling;
    if (next && next.classList?.contains('heading-anchor')) return;

    // The heading itself is NOT modified — its innerHTML is untouched.
    // We insert a sibling *after* the heading (Req 9.2 additive mutation).
    const anchorHtml =
      `<button type="button" class="heading-anchor" ` +
      `data-anchor="${h.id}" aria-label="复制链接">🔗</button>`;
    h.insertAdjacentHTML('afterend', anchorHtml);
  });
}
```

Key invariants baked into this function:

- **Additive.** The heading element's `innerHTML`, `textContent`, attributes, and child structure are all untouched. Only a new sibling appears after it. This is what preserves Req 9.2 and preserves the byte-level backward-compat guarantee for `<h2>` / `<h3>` / `<h4>` element bodies (see Backward Compatibility below).
- **Idempotent.** Re-running the function is a no-op — the sibling check short-circuits. This is what makes Req 9.8 hold even under React strict-mode double-effect execution or repeated content changes.
- **Depends on `id`.** If a heading has no `id` (because `injectHeadingIds` has not yet run, or the heading text was empty), the anchor is skipped. That is why `injectHeadingIds` must run before `injectHeadingAnchors` (see the updated Rendering Pipeline diagram above).

**`HeadingAnchorHandler` — click via event delegation:**

Rather than binding a click listener to each injected button (which would either require a mutation observer or bind listeners inside `injectHeadingAnchors` and leak them across re-mounts), we delegate on `<article>`:

```typescript
// Inside BlogContentRenderer's post-render effect:
useEffect(() => {
  const el = bodyRef.current;
  if (!el) return;
  const onClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || !target.classList?.contains('heading-anchor')) return;
    const anchorId = target.getAttribute('data-anchor');
    if (!anchorId) return;
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    try {
      await copyToClipboard(url);
      message.success('链接已复制');
    } catch {
      message.error('复制失败');
    }
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}, [bodyRef]);
```

**`copyToClipboard(url)` — primary + fallback:**

```typescript
async function copyToClipboard(text: string): Promise<void> {
  // Prefer the async Clipboard API when available (Req 9.5).
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for non-HTTPS contexts / older browsers (Req 9.6).
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  if (!ok) throw new Error('execCommand copy failed');
}
```

**Updated `BlogContentRenderer` post-render effect** — the ordering is now three passes with the click delegate added as a second effect:

```typescript
useEffect(() => {
  const el = bodyRef.current;
  if (!el) return;
  injectHeadingIds(el);
  injectHeadingAnchors(el);   // must run AFTER injectHeadingIds
  highlightPreCodeElements(el);
  // Signal ready to LastReadTracker's restore hook after this pass:
  onContentReady?.();
}, [content, bodyRef, onContentReady]);
```

`BlogView` owns the `contentReady` state and passes an `onContentReady` callback into `BlogContentRenderer`; `LastReadTracker` reads `contentReady` from its parent. This is what ties Req 8.3 (restore only after `injectHeadingIds` has run) to a concrete React ordering.

**Styling (in `headingAnchor.css`):**

```css
/* Desktop: only visible on heading hover. */
.blog-article .heading-anchor {
  opacity: 0;
  transition: opacity 0.15s ease;
  margin-left: 6px;
  cursor: pointer;
  background: transparent;
  border: none;
  font-size: 0.85em;
  line-height: 1;
  color: var(--muted);
}
.blog-article :is(h2, h3, h4):hover + .heading-anchor,
.blog-article .heading-anchor:hover,
.blog-article .heading-anchor:focus-visible {
  opacity: 1;
}

/* Mobile: always visible — no hover state available (Req 9.4). */
@media (max-width: 1024px) {
  .blog-article .heading-anchor { opacity: 1; }
}
```

Note that the hover selector uses `:is(h2, h3, h4):hover + .heading-anchor`. Because `injectHeadingAnchors` inserts the button as the immediate next sibling of the heading, the adjacent-sibling combinator (`+`) is sufficient — no wrapper element is required, and the article DOM stays flat.

## State Management

State remains component-local. Two Contexts, both scoped to the reader subtree:

- `ReaderPreferencesProvider` — reader page only. Not global; other pages should not read or persist reader preferences.
- No new global store. Blog data continues to live in `useState` inside `BlogView`, fetched via `blogApiRequest` (unchanged).

Editor state (`title`, `content`, `summary`, ...) stays inside `EditBlogs` exactly as today; no new state slices are introduced there.

## Styling & Theming

New CSS files under `src/css/career/blogView/`:

- `blogView.css` — layout + article typography (extended, not replaced)
- `tocPanel.css`
- `readingProgressBar.css`
- `readerToolbar.css`
- `codeHighlight.css` — scopes the light / dark hljs palettes under `[data-theme]`
- `themes.css` — CSS variables for `[data-theme="light|dark"]` and `[data-font-size]`
- `backToTopButton.css` — fixed positioning at `right: 24px; bottom: 96px` (chosen to clear the mobile browser chrome and never overlap the right-side TocPanel); visibility is driven by the `[data-visible="true|false"]` attribute with `opacity` + `pointer-events` toggling under a `transition: opacity 0.2s ease`; colors are pulled from the `--bg` / `--fg` / accent CSS variables in `themes.css` so contrast is preserved in both `light` and `dark` themes (Req 7.6)
- `headingAnchor.css` — desktop: `.heading-anchor { opacity: 0 }` by default with `:is(h2, h3, h4):hover + .heading-anchor { opacity: 1 }` on hover / focus (uses the adjacent-sibling combinator because `injectHeadingAnchors` places the button as an immediate sibling); mobile (`@media (max-width: 1024px)`): `.heading-anchor { opacity: 1 }` always visible; button color derived from `var(--muted)` so it reads correctly under both themes

### `tocPanel.css` — collapse controls and nested indentation

Because `TocPanel` now renders a nested tree with per-node collapse, the stylesheet needs to cover:

- **Toggle control (`.toc-toggle`)** — small monospace-sized button showing `▶` (collapsed) or `▼` (expanded). Set `width` and `line-height` so the glyph occupies the same box in both states, preventing sibling links from shifting horizontally on toggle. `cursor: pointer`, transparent background, no border.
- **Leaf placeholder (`.toc-toggle--leaf`)** — same box size as the interactive toggle but non-interactive (`pointer-events: none`, no glyph). Its sole purpose is horizontal alignment so leaf rows line up with sibling rows that do have a toggle (Req 3.13 keeps it visually consistent without exposing an inert control).
- **Nested indentation** — each level adds a small step of `padding-left`, e.g. `.toc-level-2 { padding-left: 0; }`, `.toc-level-3 { padding-left: 14px; }`, `.toc-level-4 { padding-left: 28px; }` (12–16 px per level; the exact value is a visual choice, not a correctness one).
- **Collapse mechanics** — children are hidden by not rendering the `<ul.toc-children>` element at all when `collapsed.has(parent.id)` is true. No CSS animation is required; the transition is an immediate mount/unmount. This keeps the DOM in sync with the collapse `Set`, avoids animation timing races with `activeId` updates, and means no additional style rules are needed beyond the ones above.
- **Active row (`.toc-link.is-active`)** — highlight the active entry using theme-scoped colors from `themes.css`; the highlight is applied regardless of whether the entry is nested under a collapsed ancestor (which simply hides it from view without changing the class).

All CSS goes through the existing gulp pipeline (`npx gulp styles`) to produce `.min.css` outputs referenced by the build.

### highlight.js dual theme

Rather than dynamically importing two stylesheets, we ship a single `codeHighlight.css` whose selectors are theme-scoped:

```css
.reader-root[data-theme="light"] .hljs { /* github light palette */ }
.reader-root[data-theme="dark"]  .hljs { /* github dark palette */ }
```

This gives us instant swap on theme change without a reload (Req 4.5, 6.7) and avoids race conditions during style loading.

## Error Handling

| Failure                                        | Location                     | Behavior                                                                                       |
| ---------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Image upload network error / non-2xx           | `uploadBlogImage`            | Throws; the `customUpload` handler catches, shows `message.error`, **does not call `insertFn`** (Req 2.6). |
| Non-image MIME sent to `uploadBlogImage`       | `uploadBlogImage`            | Throws synchronously before `fetch`; caller shows `message.error` (Req 2.7). wangEditor may itself pre-filter, this is the second line of defense. |
| `hljs.highlightElement` throws on odd fragment | `highlightPreCodeElements`   | Swallowed per element; other blocks still render (Req 4.3).                                    |
| Rendered body contains no `<h2>` / `<h3>` / `<h4>` | `extractToc`             | Returns `[]`; `TocPanel` renders `null`; grid drops right column (Req 3.6).                    |
| H3 appears before any H2, or H4 appears before any H3 | `buildTocTree`        | Node is attached to the nearest available ancestor (H2 if present, else promoted to top level); no throw, tree still renders (Req 3.7). |
| `activeId` lands under a currently collapsed parent | `TocPanel`              | Collapse set is not mutated; the active row simply stays hidden until the reader expands the parent; no error (Req 3.12). |
| `IntersectionObserver` not supported           | `useToc`                     | Effect early-returns; TOC still renders but active highlight is disabled.                      |
| Empty `content`                                | `BlogContentRenderer`        | Renders an empty `<article>`; TOC and progress both no-op.                                     |
| Corrupted `localStorage` preferences           | `ReaderPreferencesProvider`  | `isValidPreferences` false → remove key, use defaults (Req 6.6).                               |
| `localStorage` unavailable (private mode)      | `ReaderPreferencesProvider`  | `setPreferences` swallows the write error; in-memory state still works for the session.        |
| `navigator.clipboard.writeText` throws         | Event-delegated click on `.heading-anchor` in `BlogContentRenderer` | Caught in the delegated handler; shows `message.error('复制失败')`; no other reader feature is affected (Req 9.7). |
| `navigator.clipboard` unavailable (non-HTTPS / old browser) | `copyToClipboard` fallback | Falls back to a temporary `<textarea>` + `document.execCommand('copy')`; the reader still receives success/failure feedback (Req 9.6). |
| Corrupted `LastReadPosition` JSON              | `readRecord` inside `useLastReadPosition` | `isValidLastReadRecord` returns false → remove the key → treat as no record → reader stays at top (Req 8.6). |
| `record.headingId` refers to a heading that no longer exists in the current blog | `useRestoreScrollPosition` | `document.getElementById(record.headingId)` returns null → fall back to `window.scrollTo(0, scrollPercent * scrollMax)` (Req 8.5). |
| Restore hook fires before `injectHeadingIds` completes | `useRestoreScrollPosition` | **Prevented by contract:** restore is gated on `contentReady`, which `BlogContentRenderer` only flips to true from the same effect that runs `injectHeadingIds` → `injectHeadingAnchors` → `highlightPreCodeElements`. React effect scheduling guarantees the ordering; no runtime check is needed. |

## Backward Compatibility Strategy

Because the data model is untouched and the rendering path is still `dangerouslySetInnerHTML` with the exact same HTML string, **the byte content of `<article>.innerHTML` for a legacy blog is unchanged after upgrade**. The only three visual additions that can appear on top of that article are:

1. The top progress bar — a subtle line at the top of the viewport.
2. The right-side TOC panel — only when the blog contains `<h2>` / `<h3>` headings; legacy blogs without them see no panel.
3. The reader toolbar — a top-right control cluster (font size + theme), positioned so it never overlaps the article body.

The editor path is likewise preserved: the same wangEditor with the same content type. We only add:

- Explicit `toolbarKeys` — wangEditor's default toolbar already contains all of these; making the list explicit turns Requirement 1 into a compile-time guarantee.
- `customUpload` on `MENU_CONF.uploadImage` — this replaces wangEditor's default upload behavior (which required a server URL). Before this change the image button did not have a working upload; after this change it uploads through our endpoint. Paste and drop of images behave identically because they were already routed through `uploadImage` internally.

If any reader-side visual addition proves disruptive, it can be gated by a top-level flag on the reader page without changing the renderer contract.

**Note on byte-equality after HeadingAnchor injection.** Once `injectHeadingAnchors` runs, `<article>.innerHTML` is no longer byte-identical to the wangEditor-emitted string — each `<h2>` / `<h3>` / `<h4>` is now followed by an additional `.heading-anchor` sibling `<button>`. What **is** preserved is a slightly finer invariant: for every heading element `h` in the rendered article, `h.innerHTML` is byte-identical to the corresponding heading's `innerHTML` in the wangEditor fixture. Because HeadingAnchor is a purely additive sibling injection, the heading elements themselves — their tag, attributes, text nodes, and any child spans — remain untouched.

The regression fixture assertion is therefore refined: instead of asserting `article.innerHTML === fixture`, we assert, for each heading, that `renderedHeading.innerHTML === fixtureHeading.innerHTML`, and separately verify that (a) the non-heading portions of the article match the fixture byte-for-byte and (b) the heading-anchor siblings are structurally what `injectHeadingAnchors` is expected to produce (one anchor per heading, `data-anchor` equal to the heading's `id`). This keeps the guarantee strong where it matters (the author's authored content is not rewritten) while allowing the additive UI mutation the requirements explicitly authorize.

## Testing Strategy

**Test pyramid:**

- **Property-based tests** (`fast-check`): universal properties over pure functions and unit-level handlers. Each property runs a minimum of 100 iterations and carries a tag `Feature: blog-reading-experience, Property N: <text>`.
- **Example / edge-case unit tests** (`@testing-library/react`): specific UI presence checks (toolbar button set, three-column layout, drawer trigger), specific fixtures (corrupted localStorage strings, empty content), and byte-equality regression fixtures for legacy HTML.
- **Integration tests**: 1–2 examples for the image upload endpoint hitting a real Express handler with mocked multer storage.

**Property test targets** (see next section):

- Pure functions test cheaply in memory with generators: `computeProgress`, `extractToc`, `selectActiveEntry`, `isValidPreferences`, `highlightPreCodeElements`'s class-preservation invariant.
- `customUpload` handler is a small closure and can be exercised directly with mocked `uploadBlogImage`.
- Preferences persistence uses a jsdom `localStorage` under `fast-check`.

**Unit test focus:**

- Toolbar keys — one example per key from Requirement 1.
- Layout — desktop three-column, mobile drawer, no-toc collapse.
- Byte-equal fixture — a sampled legacy blog's rendered `innerHTML` before and after upgrade.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Successful image upload inserts exactly once

*For any* `File` `f` with `f.type` starting with `'image/'`, when `customUpload(f, insertFn)` is invoked and `uploadBlogImage` resolves with `{ url }`, `insertFn` is called exactly once with `url` and no error notification is emitted.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Failed image upload does not modify editor content

*For any* `File` `f` for which `uploadBlogImage` rejects (network failure or non-2xx response), invoking `customUpload(f, insertFn)` results in `insertFn` never being called and exactly one user-visible error notification being emitted.

**Validates: Requirements 2.6**

### Property 3: Non-image files never reach the upload endpoint

*For any* `File` `f` whose `f.type` does not start with `'image/'`, calling `uploadBlogImage(f)` rejects synchronously and `fetch` is never invoked.

**Validates: Requirements 2.7**

### Property 4: TOC extraction is a pure function of the rendered DOM

*For any* rendered blog body DOM `d`, `extractToc(d)` returns exactly the sequence of `<h2>`, `<h3>`, and `<h4>` elements in `d` that carry a non-empty `id`, in document order, with `level = 2` for `<h2>`, `level = 3` for `<h3>`, and `level = 4` for `<h4>` (i.e. `level ∈ {2, 3, 4}`); in particular, `extractToc(d) = []` if and only if `d` contains no such headings, in which case `TocPanel` renders no output.

**Validates: Requirements 3.1, 3.6**

### Property 5: TOC click scrolls to the corresponding heading

*For any* TOC entry `e` in a rendered blog, clicking `e` invokes `scrollIntoView({ behavior: 'smooth' })` on exactly the DOM element whose `id` equals `e.id`.

**Validates: Requirements 3.4**

### Property 6: Active TOC entry is the topmost visible heading

*For any* set of intersecting heading elements `V` produced by `IntersectionObserver`, `selectActiveEntry(V, prev)` returns `prev` when `V` is empty and otherwise returns the `id` of the element in `V` with the smallest `boundingClientRect.top`.

**Validates: Requirements 3.5**

### Property 7: Code block highlighting is total

*For any* rendered blog body DOM `d`, `highlightPreCodeElements(d)` returns without throwing, and after execution every `<pre> > <code>` element in `d` either carries the `hljs` class or was skipped by the idempotency guard because it already did.

**Validates: Requirements 4.1, 4.3**

### Property 8: `language-<lang>` class survives the editor-to-reader round-trip

*For any* language tag `l` and any HTML fragment produced by wangEditor of the form `<pre><code class="language-<l>">...</code></pre>`, after passing through `highlightPreCodeElements`, the resulting `<code>` element's `classList` still contains `language-<l>`.

**Validates: Requirements 1.10, 4.2, 4.4**

### Property 9: Reading progress is the clamped scroll ratio

*For any* pair `(scrollTop, scrollMax)` with `scrollMax >= 0`, `computeProgress(scrollTop, scrollMax)` equals `0` when `scrollMax = 0`, equals `1` when `scrollTop >= scrollMax`, equals `0` when `scrollTop <= 0`, and otherwise equals `scrollTop / scrollMax`; in particular, reaching `scrollTop = scrollMax` yields progress `1`.

**Validates: Requirements 5.2, 5.3**

### Property 10: Preference changes apply immediately to the reader root

*For any* preference transition from `p` to `p'`, immediately after `setPreferences(p')` completes, the reader root element's `data-theme` attribute equals `p'.theme` and its `data-font-size` attribute equals `p'.fontSize`.

**Validates: Requirements 6.3**

### Property 11: Preferences persistence round-trip

*For any* valid `ReaderPreferences` value `p`, calling `setPreferences(p)` and then re-mounting `ReaderPreferencesProvider` produces an initial state equal to `p`; equivalently, `JSON.parse(localStorage.getItem(READER_PREFS_STORAGE_KEY))` deserializes to `p` immediately after `setPreferences(p)`.

**Validates: Requirements 6.4, 6.5**

### Property 12: Corrupted preferences fall back to defaults

*For any* string `s` stored under `READER_PREFS_STORAGE_KEY` such that `isValidPreferences(JSON.parse(s))` is false (including malformed JSON), mounting `ReaderPreferencesProvider` initializes the reader with `DEFAULT_PREFERENCES` and removes the corrupted entry from `localStorage`.

**Validates: Requirements 6.6**

### Property 13: `buildTocTree` is the flat-to-nested pure mapping

*For any* flat `TocEntry[]` `entries` produced by `extractToc`, `buildTocTree(entries)` returns a `TocTreeNode[]` such that: (a) every H2 entry appears as a top-level node; (b) every H3 entry appears as a child of the nearest preceding H2 (or as a top-level node if no such H2 exists); (c) every H4 entry appears as a child of the nearest preceding H3 within the current H2 subtree (or, as a fallback, of the nearest available ancestor); and (d) depth-first traversal of the resulting tree yields exactly `entries` in the same order as the input.

**Validates: Requirements 3.1, 3.7**

### Property 14: Collapse state is a rendering-only concern

*For any* rendered blog body DOM `d` and any collapse `Set<string>` `c`, `extractToc(d)` and `selectActiveEntry(V, prev)` (for any visible-heading list `V` and previous `prev`) produce outputs that are independent of `c`; equivalently, mutating `TocPanel`'s internal `collapsed` set changes neither the `entries` returned by `useToc` nor the `activeId` computed from `IntersectionObserver` records.

**Validates: Requirements 3.11, 3.12**

### Property 15: Only non-leaf entries render a collapse control

*For any* `TocTreeNode` `n` rendered by `TocPanel`, `n.children.length > 0` if and only if the rendered row contains a clickable `.toc-toggle` control (i.e. `role=button` / `<button>`) that toggles the visibility of `n`'s children on click; when `n.children.length === 0`, the row contains no interactive collapse control (leaf placeholder is non-interactive).

**Validates: Requirements 3.8, 3.9, 3.13**

### Property 16: `BackToTopButton` visibility equals scroll-threshold predicate

*For any* window state characterized by `scrollY` and `viewportHeight` with `threshold = viewportHeight * 0.5`, `useScrollThreshold()` returns `true` if and only if `scrollY >= threshold`; equivalently, `BackToTopButton`'s `data-visible` attribute equals `"true"` iff `scrollY >= viewportHeight * 0.5`.

**Validates: Requirements 7.3, 7.4**

### Property 17: Clicking `BackToTopButton` triggers exactly one smooth scroll to the top

*For any* click event sequence of length `n >= 0` on a rendered `BackToTopButton`, `window.scrollTo` is invoked exactly `n` times, each invocation passing `{ top: 0, behavior: 'smooth' }`; no other scroll targets are produced by the button.

**Validates: Requirements 7.5**

### Property 18: `LastReadPosition` read/write round-trip

*For any* `blogId` and any valid `record: LastReadRecord` (i.e. `isValidLastReadRecord(record)` is true), calling `saveRecord(record)` under `useLastReadPosition(blogId)` and then re-mounting the hook yields an initial `record` deep-equal to the input; equivalently, `JSON.parse(localStorage.getItem('blog-last-read-' + blogId))` deep-equals `record` immediately after `saveRecord(record)`, and this equality holds independently for distinct `blogId`s (per-blog isolation).

**Validates: Requirements 8.1, 8.2, 8.3, 8.8**

### Property 19: `LastReadPosition` restore priority

*For any* `(record, dom, contentReady = true)` triple: (a) if `record !== null` and `dom.querySelector('#' + record.headingId)` returns a non-null element, `useRestoreScrollPosition` invokes that element's `scrollIntoView` exactly once and never calls `window.scrollTo`; (b) if `record !== null` but the heading element is absent, `useRestoreScrollPosition` invokes `window.scrollTo(0, record.scrollPercent * scrollMax)` exactly once and never calls `scrollIntoView`; (c) if `record === null` (missing or corrupted storage entry), neither `scrollIntoView` nor `window.scrollTo` is invoked and no exception propagates.

**Validates: Requirements 8.4, 8.5, 8.6**

### Property 20: `injectHeadingAnchors` is an idempotent additive mutation

*For any* DOM tree `d` and any `n >= 1`, after applying `injectHeadingAnchors(d)` `n` times: (a) every `<h2>` / `<h3>` / `<h4>` element in `d` that carries a non-empty `id` has exactly one immediately-following sibling with class `heading-anchor` (no duplicates from repeated application); (b) for every such heading `h`, `h.innerHTML` is unchanged from its value before the first application (additive: the heading's own children are never touched); (c) the `data-anchor` attribute on each inserted `.heading-anchor` equals its associated heading's `id`.

**Validates: Requirements 9.1, 9.2, 9.8**
