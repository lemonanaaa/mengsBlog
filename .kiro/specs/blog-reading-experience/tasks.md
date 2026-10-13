# Implementation Plan: Blog Reading Experience

## Overview

按 design.md 的两条路径分阶段落地：编辑侧只对现有 `editBlogs/View.tsx` 就地改两处配置（`toolbarConfig` + `MENU_CONF.uploadImage.customUpload`），阅读侧新增一个渲染组件（`dangerouslySetInnerHTML` + 三步 DOM 后处理）以及 TOC、进度条、阅读偏好、返回顶部按钮、上次阅读位置记忆、章节锚点复制等辅助能力，最后再拼装到阅读页。数据模型不动、`Blog` schema 与既有博客 CRUD 接口都不动；后端唯一新增件是博客图片上传接口。测试用 `fast-check` 覆盖 design.md 的 20 条 Correctness Properties，并加一个老 HTML 博客的字节级一致回归 fixture 断言。

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Tasks

- [ ] 1. 后端博客图片上传接口
  - [ ] 1.1 新增 `POST /api/blogs/upload-image` 路由与静态目录挂载
    - 在 `routes/blogs.js` 挂载 multer（磁盘存储），MIME 白名单 `image/png,jpeg,gif,webp,svg+xml`，单文件上限 5MB
    - 文件落到 `uploads/blogs/<yyyy-MM-dd>/<uuid>.<ext>`（扩展名由 sniffed MIME 决定）
    - 在 app 层将 `uploads/blogs/` 暴露为静态目录（参考已有 `uploads/` 模式）
    - 成功响应 `{ success: true, data: { url } }`；MIME 或大小不合法响应 400；meng-mode 鉴权失败响应 401
    - 不改动既有 blog CRUD 路由与 `Blog` schema
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

  - [ ]* 1.2 集成测试：上传接口正常与拒绝路径
    - 使用 supertest：正常图片上传返回 200 + url；非图片 MIME 返回 400；超大文件返回 400；未授权返回 401
    - _Requirements: 2.2, 2.7, 2.8_

- [ ] 2. Checkpoint - 后端能力可用
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. 前端底座（类型 + API helper）
  - [ ] 3.1 新增阅读偏好类型 `src/pages/career/blogView/types.ts`
    - 导出 `FontSize = 'sm'|'md'|'lg'`、`Theme = 'light'|'dark'`、`ReaderPreferences` 接口
    - 导出 `DEFAULT_PREFERENCES = { fontSize: 'md', theme: 'light' }`
    - 导出 `READER_PREFS_STORAGE_KEY = 'blog-reader-preferences'`
    - 手写 `isValidPreferences(x: unknown): x is ReaderPreferences` 谓词（同时作为存储校验器与 property 测试的 oracle，避免引入 zod）
    - _Requirements: 6.1, 6.2, 6.6_

  - [ ] 3.2 在 `src/config/api.ts` 新增 `uploadBlogImage(file)` helper
    - 前置 MIME 校验：`file.type` 不以 `image/` 开头时同步 throw `Only image files are allowed`（在 `fetch` 之前）
    - 用 `fetch` + `FormData` 提交到 `${API_CONFIG.BLOG_BASE_URL}/blogs/upload-image`（不复用 `blogApiRequest`，因为它强制 `Content-Type: application/json`）
    - 非 2xx 或响应缺失 `data.url` 时 throw 明确错误
    - 成功时返回 `{ url }`
    - _Requirements: 2.2, 2.5, 2.7_

  - [ ]* 3.3 属性测试：非图片文件永远不进入 UploadEndpoint
    - **Property 3: Non-image files never reach the upload endpoint**
    - 用 fast-check 生成任意 `file.type` 不以 `image/` 开头的 `File`，断言 `uploadBlogImage(f)` 同步 reject 且 `global.fetch` 从未被调用
    - _Validates: Requirements 2.7_

- [ ] 4. 编辑器就地改造（`editBlogs/View.tsx` 两处配置）
  - [ ] 4.1 重写 `editBlogs/View.tsx` 的 `toolbarConfig` 与 `editorConfig`
    - `toolbarConfig.toolbarKeys` 显式列出 11 个 key：`headerSelect, bold, italic, bulletedList, numberedList, code, codeBlock, blockquote, insertLink, insertImage, insertTable`（把 Requirement 1 的能力集合固化下来）
    - `editorConfig.MENU_CONF.uploadImage.customUpload = async (file, insertFn) => { try { const { url } = await uploadBlogImage(file); insertFn(url); } catch (err) { message.error(err?.message || '图片上传失败'); } }`
    - 不新增组件、不新增 paste / drop 监听（wangEditor 内部已把三种触发路径收敛到 `customUpload`）
    - 保持既有 meng-mode 鉴权拦截逻辑不动
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 4.2 属性测试：成功上传恰好插入一次
    - **Property 1: Successful image upload inserts exactly once**
    - 用 fast-check 生成任意 `image/*` File 与任意 url，mock `uploadBlogImage` 返回 `{ url }`，直接调用 `customUpload(f, insertFn)`，断言 `insertFn` 被以该 url **恰好调用一次**，且 `message.error` 从未被调用
    - _Validates: Requirements 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.3 属性测试：上传失败不写入编辑器
    - **Property 2: Failed image upload does not modify editor content**
    - 用 fast-check 让 `uploadBlogImage` 随机以网络错误 / 非 2xx / 畸形响应 reject，调用 `customUpload(f, insertFn)`，断言 `insertFn` 从未被调用且 `message.error` 恰好被调用一次
    - _Validates: Requirements 2.6_

- [ ] 5. Checkpoint - 编辑器闭环可用
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. 阅读渲染核心
  - [ ] 6.1 新增 `src/pages/career/blogView/postRender.ts`
    - 内部 `slugify(text)`：小写化、空格转 `-`、剥离非字母数字与非中日韩字符
    - `injectHeadingIds(root)`：对 h1-h6 中缺 id 的节点按 slug 生成并全局去重（碰撞时追加 `-1 / -2 / ...`），已有 id 保留不覆盖，幂等
    - `injectHeadingAnchors(root)`：遍历 `<h2>/<h3>/<h4>`，跳过无 id 的节点；若下一个 sibling 已经是 `.heading-anchor` 则跳过（幂等 guard）；使用 `heading.insertAdjacentHTML('afterend', '<button type="button" class="heading-anchor" data-anchor="<id>" aria-label="复制链接">🔗</button>')` 插入 sibling；不修改 heading 自身的 innerHTML / attributes / children
    - `highlightPreCodeElements(root)`：遍历 `pre > code`，跳过已带 `hljs` class 的节点，调用 `hljs.highlightElement`；每次调用用 `try { ... } catch {}` 包裹，保证坏片段不外抛；不改写 `<code>` 上已有的 `language-*` class
    - 三个函数都是纯 DOM mutation，无副作用外泄
    - _Requirements: 3.1, 3.6, 4.1, 4.2, 4.3, 4.4, 9.1, 9.2, 9.8_

  - [ ] 6.2 新增 `src/pages/career/blogView/BlogContentRenderer.tsx`
    - Props：`content: string`、`bodyRef: React.RefObject<HTMLDivElement>`、`onContentReady?: () => void`
    - 顶层 `<article ref={bodyRef} className="blog-article" dangerouslySetInnerHTML={{ __html: content }} />`
    - 第一个 useEffect（三步 pass）：`useEffect(() => { const el = bodyRef.current; if (!el) return; injectHeadingIds(el); injectHeadingAnchors(el); highlightPreCodeElements(el); onContentReady?.(); }, [content, bodyRef, onContentReady])`；顺序不可乱：`injectHeadingIds` 必须先于 `injectHeadingAnchors`（后者依赖 id）
    - 第二个 useEffect（事件委托）：在 `<article>` 上挂 click listener；判断 `target.classList.contains('heading-anchor')`，读取 `data-anchor` 拼装 `${window.location.origin}${window.location.pathname}#${anchorId}`，调用统一的 `copyToClipboard(url)` helper（主 `navigator.clipboard.writeText` + fallback `<textarea> + document.execCommand('copy')` 两条路径实现在同一个 helper 里）；成功 `message.success('链接已复制')`，抛错 `message.error('复制失败')`；卸载时移除 listener
    - 完成后通过 `onContentReady?.()` 通知父组件（供 `LastReadTracker` 的恢复逻辑作为 `contentReady` 翻转触发器）
    - 不在 `<article>` 内部渲染任何 React 子节点，保证 heading 元素自身的 `innerHTML` 与升级前逐字节一致（heading 后新增的 `.heading-anchor` sibling 是附加节点，不属于 heading 元素自身）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.1, 9.5, 9.6, 9.7_

  - [ ]* 6.3 属性测试：代码高亮完备且不抛错
    - **Property 7: Code block highlighting is total**
    - 用 fast-check 生成任意 HTML 字符串（含随机字符 / 未闭合标签 / 嵌套 pre code），渲染到临时容器后调用 `highlightPreCodeElements(root)`，断言函数返回不抛错且所有 `pre > code` 节点要么带 `hljs` class 要么已被幂等 guard 跳过
    - _Validates: Requirements 4.1, 4.3_

  - [ ]* 6.4 属性测试：`language-<lang>` class 编辑到阅读端往返保留
    - **Property 8: `language-<lang>` class survives the editor-to-reader round-trip**
    - 用 fast-check 生成任意语言 tag `l` ∈ 常见语言集合，构造 `<pre><code class="language-${l}">${payload}</code></pre>` 片段，调用 `highlightPreCodeElements(root)` 后断言 `<code>.classList` 仍包含 `language-${l}`
    - _Validates: Requirements 1.10, 4.2, 4.4_

- [ ] 7. TOC 目录能力
  - [ ] 7.1 新增 `src/pages/career/blogView/useToc.ts`
    - 导出纯函数 `extractToc(root): TocEntry[]`：按 document order 收集 `<h2>`/`<h3>`/`<h4>`，跳过无 id 的节点，`level = 2 | 3 | 4`
    - 导出 `TocTreeNode` 类型（`extends TocEntry` + `children: TocTreeNode[]`）
    - 导出纯函数 `buildTocTree(entries: TocEntry[]): TocTreeNode[]`：H2 → 顶层节点；H3 → 最近前置 H2 的子节点（fallback：无 H2 时提升为顶层）；H4 → 当前 H2 subtree 内最近前置 H3 的子节点（fallback：跳过 H3 时挂到当前 H2；完全无祖先时提升为顶层）；纯函数，无 DOM 访问 / 无状态 / 无副作用
    - 导出纯函数 `selectActiveEntry(visible, prevActive)`：`visible` 为空则返回 `prevActive`；否则返回 `boundingClientRect.top` 最小的元素 id
    - `useToc(bodyRef, contentKey)`：content 变化时刷新 entries；用 `IntersectionObserver`（`rootMargin: '0px 0px -70% 0px'`）追踪可见标题；`IntersectionObserver` 不可用时优雅降级（entries 正常，activeId 保持 null）
    - _Requirements: 3.1, 3.5, 3.6, 3.7_

  - [ ] 7.2 新增 `src/pages/career/blogView/TocPanel.tsx`
    - Props：`entries`、`activeId`
    - 内部 state：`collapsed: Set<string>`，`useState(() => new Set())`，默认空集（首次渲染所有层级展开，对应 AC 3.10）
    - 用 `useMemo(() => buildTocTree(entries), [entries])` 生成渲染树；`tree.length === 0` 时返回 `null`（不占布局空间）
    - 每个含子节点（`children.length > 0`）的条目渲染 `<button type="button" className="toc-toggle" aria-expanded={!isCollapsed}>▶/▼</button>`；点击调用 `toggle(id)`，`toggle` 内以不可变方式更新 `collapsed`（复制 Set → add / delete → setCollapsed）
    - 叶子条目（`children.length === 0`）渲染 `<span className="toc-toggle toc-toggle--leaf" aria-hidden="true" />` 占位保持对齐，无交互
    - 递归渲染 `node.children` 仅当 `!collapsed.has(node.id)`（通过 mount/unmount 生效，不用 CSS 动画）
    - `activeId` 高亮 (`toc-link.is-active`) 独立于 `collapsed` 状态；activeId 落在被折叠父级下时不改变 `collapsed`、不抛错
    - 点击条目调用 `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13_

  - [ ]* 7.3 属性测试：extractToc 是渲染 DOM 的纯函数
    - **Property 4: TOC extraction is a pure function of the rendered DOM**
    - 用 fast-check 生成任意标题层级组合（含无 h2/h3 的样本），构造对应 DOM，断言 `extractToc(d)` 返回的条目顺序、level、id 集合与生成器输入的期望一致；无 h2/h3 时返回 `[]`
    - _Validates: Requirements 3.1, 3.6_

  - [ ]* 7.4 属性测试：点击 TOC 条目触发 scrollIntoView
    - **Property 5: TOC click scrolls to the corresponding heading**
    - Mock `HTMLElement.prototype.scrollIntoView`，用 fast-check 生成 entries 列表挂载 `TocPanel` 并随机点击其中一条，断言恰好在 `id === entry.id` 的元素上调用 `scrollIntoView({ behavior: 'smooth' })`
    - _Validates: Requirements 3.4_

  - [ ]* 7.5 属性测试：active 条目为最靠前可见标题
    - **Property 6: Active TOC entry is the topmost visible heading**
    - 用 fast-check 生成一组带 `boundingClientRect.top` 的伪 `HTMLElement` 列表以及 `prevActive`，直接调用 `selectActiveEntry(visible, prevActive)`，断言：`visible` 为空返回 `prevActive`；否则返回 `top` 最小元素的 id
    - _Validates: Requirements 3.5_

  - [ ]* 7.6 属性测试：`buildTocTree` 是 flat-to-nested 的纯映射
    - **Property 13: `buildTocTree` is the flat-to-nested pure mapping**
    - 用 fast-check 生成任意 flat `TocEntry[]`（覆盖边界：H3 无 H2、H4 无 H3、H4 完全无祖先、H2/H3/H4 常规嵌套、连续同级），断言：（a）所有 H2 entries 都出现在返回结果的顶层；（b）每个 H3 entry 挂到最近前置 H2 的 `children`，若无 H2 则出现在顶层；（c）每个 H4 entry 挂到当前 H2 subtree 中最近前置 H3 的 `children`，回退到当前 H2 的 `children`，最后回退到顶层；（d）对返回的 `TocTreeNode[]` 做 DFS（root → children）得到的 entry 序列在 `id` / `level` / `text` 三元组上严格等于输入 `entries` 的顺序
    - _Validates: Requirements 3.1, 3.7_

  - [ ]* 7.7 属性测试：折叠状态只影响渲染
    - **Property 14: Collapse state is a rendering-only concern**
    - 用 fast-check 生成任意 `TocEntry[]` `entries` + 任意 `collapsed: Set<string>`，断言：`extractToc` 与 `selectActiveEntry` 的输出均与 `collapsed` 无关（等价形式：对同一份 body DOM 和同一份 `visible` 列表，`collapsed` 取任何值时 `useToc` 返回的 `entries` 与 `activeId` 均保持一致，即折叠 Set 的任何变化都不改变这两个值的计算结果）
    - _Validates: Requirements 3.11, 3.12_

  - [ ]* 7.8 属性测试：叶子无控件、父节点有控件
    - **Property 15: Only non-leaf entries render a collapse control**
    - 用 fast-check 生成任意 `TocEntry[]`，`buildTocTree` 得到 `TocTreeNode` 集合后挂载 `TocPanel`，断言：对每个 `node`，`node.children.length > 0` 当且仅当 DOM 中该行渲染出一个可点击的 `.toc-toggle` `<button>`，且点击该 button 后 `node` 的子节点渲染可见性发生切换；当 `node.children.length === 0` 时，该行不存在交互控件（叶子占位符类名为 `toc-toggle--leaf`，CSS 保证 `pointer-events: none`）
    - _Validates: Requirements 3.8, 3.9, 3.13_

- [ ] 8. 阅读进度条
  - [ ] 8.1 新增 `src/pages/career/blogView/useReadingProgress.ts`
    - 导出纯函数 `computeProgress(scrollTop, scrollMax)`：非有限值 → 0；`scrollMax <= 0` → 0；`raw < 0` → 0；`raw > 1` → 1；否则 `scrollTop / scrollMax`
    - `useReadingProgress()`：监听 window `scroll` / `resize`，从 `document.documentElement` 读 `scrollTop` 与 `scrollHeight - clientHeight`，返回当前进度；`useEffect` 首次运行时立刻算一次，卸载时清理监听
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 8.2 新增 `src/pages/career/blogView/ReadingProgressBar.tsx`
    - 固定定位 `<div className="reading-progress-bar">`，内部子节点 `width: ${progress * 100}%`
    - 视觉贴顶部；填充色走主题变量 `--accent`
    - _Requirements: 5.1_

  - [ ]* 8.3 属性测试：computeProgress 是 clamp 后的滚动比
    - **Property 9: Reading progress is the clamped scroll ratio**
    - 用 fast-check 生成任意 `(scrollTop, scrollMax)`（含负数、超 max、0、NaN、Infinity），断言四个边界条件全部成立，且 `scrollTop === scrollMax > 0` 时结果为 `1`
    - _Validates: Requirements 5.2, 5.3_

- [ ] 9. 阅读偏好（字号 / 主题 / localStorage）
  - [ ] 9.1 新增 `src/pages/career/blogView/ReaderPreferencesProvider.tsx`
    - React Context，`useState` 惰性初始化：读 `localStorage.getItem(READER_PREFS_STORAGE_KEY)`；非 JSON / `isValidPreferences` 为 false 时删除该 key 并回退 `DEFAULT_PREFERENCES`
    - `setPreferences` 同步写 state，同时 try/catch 写回 localStorage（配额或私有模式失败时降级为内存态）
    - 在 Provider 外层输出 `<div className="reader-root" data-theme={theme} data-font-size={fontSize}>`，作为 CSS 变量的 selector 挂载点
    - 导出 `useReaderPreferences()` hook，Context 外使用时 throw
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 9.2 新增 `src/pages/career/blogView/ReaderToolbar.tsx`
    - 通过 `useReaderPreferences` 拿 `{ preferences, setPreferences }`
    - 字号三档按钮（sm/md/lg）+ 明暗主题切换按钮；点击后直接更新 preferences
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 9.3 属性测试：偏好变更立即反映到 reader 根节点
    - **Property 10: Preference changes apply immediately to the reader root**
    - 用 fast-check 生成 `p → p'` 变更序列，`act` 内调用 `setPreferences(p')`，断言下一次 render 后 `[data-theme]` 等于 `p'.theme`，`[data-font-size]` 等于 `p'.fontSize`
    - _Validates: Requirements 6.3_

  - [ ]* 9.4 属性测试：偏好持久化 round-trip
    - **Property 11: Preferences persistence round-trip**
    - 用 fast-check 生成任意合法 `ReaderPreferences p`，`setPreferences(p)` 后卸载 Provider 再重挂，断言初始 state 等于 `p`；等价断言 `JSON.parse(localStorage[READER_PREFS_STORAGE_KEY])` 反序列化后严格等于 `p`
    - _Validates: Requirements 6.4, 6.5_

  - [ ]* 9.5 属性测试：损坏偏好回退默认并清理
    - **Property 12: Corrupted preferences fall back to defaults**
    - 用 fast-check 生成任意让 `isValidPreferences(JSON.parse(s))` 为 false 的字符串 `s`（含非 JSON），设置 `localStorage[READER_PREFS_STORAGE_KEY] = s` 后挂载 Provider，断言状态为 `DEFAULT_PREFERENCES` 且 localStorage 中该 key 已被移除
    - _Validates: Requirements 6.6_

- [ ] 10. 返回顶部按钮
  - [ ] 10.1 新增 `src/pages/career/blogView/useScrollThreshold.ts`
    - 纯函数 hook：监听 window `scroll` / `resize`；`threshold` 默认为 `window.innerHeight * 0.5`（每次事件触发时重新计算，随视口高度变化）
    - 返回 boolean `isVisible = window.scrollY >= threshold`
    - `useEffect` 首次挂载立即算一次，卸载时清理监听
    - _Requirements: 7.3, 7.4_

  - [ ] 10.2 新增 `src/pages/career/blogView/BackToTopButton.tsx`
    - Props：`onScrollTop?: () => void`
    - 使用 `useScrollThreshold` 获得 `isVisible`
    - Fixed 定位（CSS 里配 `right: 24px; bottom: 96px`），通过 `data-visible={isVisible ? 'true' : 'false'}` 属性驱动 opacity / pointer-events 切换（不用 React 条件渲染，保证过渡动画完整）
    - 点击调用 `window.scrollTo({ top: 0, behavior: 'smooth' })` 后再调用 `onScrollTop?.()`
    - `type="button"`、`aria-label="返回顶部"`
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [ ]* 10.3 属性测试：可见性等价于阈值判定
    - **Property 16: `BackToTopButton` visibility equals scroll-threshold predicate**
    - 用 fast-check 生成任意 `(scrollY, viewportHeight)`（含 0 与超大值），mock `window.scrollY` / `window.innerHeight`，触发 scroll / resize 事件后断言 `useScrollThreshold()` 返回 true 当且仅当 `scrollY >= viewportHeight * 0.5`
    - _Validates: Requirements 7.3, 7.4_

  - [ ]* 10.4 属性测试：点击触发 window.scrollTo({ top: 0, behavior: 'smooth' })
    - **Property 17: Clicking `BackToTopButton` triggers exactly one smooth scroll to the top**
    - Mock `window.scrollTo`，用 fast-check 生成 n 次点击序列（n 从 0 到 5），依次触发点击，断言 `window.scrollTo` 恰好被以 `{ top: 0, behavior: 'smooth' }` 调用 n 次；没有其他调用形态
    - _Validates: Requirements 7.5_

- [ ] 11. 上次阅读位置记忆
  - [ ] 11.1 新增 `src/pages/career/blogView/useLastReadPosition.ts`
    - 导出 `LastReadRecord` 类型：`{ headingId: string | null; scrollPercent: number }`
    - 导出 `lastReadStorageKey(blogId) = 'blog-last-read-<blogId>'`
    - 手写谓词 `isValidLastReadRecord(x): x is LastReadRecord`（`scrollPercent` 为有限数值且 ∈ [0, 1]，`headingId` 为 string 或 null），既作存储校验器又作 property 测试 oracle
    - `useLastReadPosition(blogId)`：返回 `{ record, saveRecord, clearRecord }`；`useState` 惰性初始化读 localStorage → JSON.parse → `isValidLastReadRecord` 校验，非法或抛错时删 key 并回退 `null`；`saveRecord(next)` 写 state 同时 try/catch 写 localStorage；`clearRecord()` 删 state 且 try/catch 删 localStorage
    - _Requirements: 8.2, 8.6, 8.8_

  - [ ] 11.2 在同一文件新增内部 hook `useScrollRecorder(blogId, activeId)`
    - 用 `useRef` 存 timer 句柄；用 `useRef` 缓存最新 `activeId` 避免 stale closure
    - 监听 window `scroll`；500ms 防抖后调用 `saveRecord({ headingId: activeIdRef.current, scrollPercent: clamp(window.scrollY / (scrollHeight - clientHeight), 0, 1) })`
    - `scrollHeight - clientHeight <= 0` 时 `scrollPercent` 记为 0
    - 卸载时清 timer 与监听
    - _Requirements: 8.1, 8.2_

  - [ ] 11.3 在同一文件新增内部 hook `useRestoreScrollPosition(blogId, contentReady)`
    - 使用 `useRef` 存 `didRestore` 布尔位，保证 restore 逻辑只执行一次
    - `contentReady` 为 true 且 `didRestore` 为 false 时：读 record → 若 `record?.headingId` 命中 DOM（`document.getElementById(headingId)` 非空），调 `element.scrollIntoView()`；否则若 record 存在，调 `window.scrollTo(0, record.scrollPercent * scrollMax)`；record 为 null 时既不 scrollTo 也不 scrollIntoView
    - _Requirements: 8.3, 8.4, 8.5, 8.6_

  - [ ] 11.4 新增 `src/pages/career/blogView/LastReadTracker.tsx`
    - Props：`{ blogId: string; contentReady: boolean; activeId: string | null }`
    - 内部同时调用 `useScrollRecorder(blogId, activeId)` 与 `useRestoreScrollPosition(blogId, contentReady)`
    - 返回 `null`（headless 组件，无 UI 输出）
    - _Requirements: 8.1, 8.3_

  - [ ]* 11.5 属性测试：LastReadPosition 读写往返 + 按 blogId 隔离
    - **Property 18: `LastReadPosition` read/write round-trip**
    - 用 fast-check 生成任意合法 record（`isValidLastReadRecord` 为 true）与任意 blogId 列表，`saveRecord(record)` 后卸载再重挂 `useLastReadPosition(blogId)`，断言初始 `record` 深等于输入；不同 blogId 存写互不干扰（同时保存多个 blogId 的不同 record，逐一验证读回的值仍与各自输入一致）
    - _Validates: Requirements 8.1, 8.2, 8.3, 8.8_

  - [ ]* 11.6 属性测试：恢复优先级三分支
    - **Property 19: `LastReadPosition` restore priority**
    - 用 fast-check 生成 `(record, dom)` 三类分支：（a）`record !== null` 且 `record.headingId` 命中 DOM → `scrollIntoView` 恰调 1 次、`window.scrollTo` 从未调用；（b）`record !== null` 且 `record.headingId` 不命中 DOM（含 headingId 为 null 的情况）→ `window.scrollTo(0, record.scrollPercent * scrollMax)` 恰调 1 次、`scrollIntoView` 从未调用；（c）`record === null` → 两个 API 均从未调用且无异常抛出
    - _Validates: Requirements 8.4, 8.5, 8.6_

- [ ] 12. 章节锚点复制（HeadingAnchor）
  - [ ] 12.1 新增 `copyToClipboard(text)` helper
    - 位置：`src/pages/career/blogView/postRender.ts` 或独立 `src/pages/career/blogView/clipboard.ts` 文件
    - 优先分支：`navigator.clipboard && typeof navigator.clipboard.writeText === 'function'` 时 `await navigator.clipboard.writeText(text)`
    - Fallback 分支：不可用时创建临时 `<textarea>`（`readonly`、`position: fixed; left: -9999px`），塞入文本、`select()`、`document.execCommand('copy')`；成功后移除 textarea；`execCommand` 返回 false 时 throw
    - 主分支或 fallback 分支抛错时向调用方 propagate（不吞异常），由 BlogContentRenderer 事件委托捕获后展示 `message.error('复制失败')`
    - `injectHeadingAnchors` 已在任务 6.1 扩展；本任务只新增 helper 本身
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ]* 12.2 属性测试：injectHeadingAnchors 是幂等 additive mutation
    - **Property 20: `injectHeadingAnchors` is an idempotent additive mutation**
    - 用 fast-check 生成任意含 h2/h3/h4 的 DOM 与任意重复调用次数 n ≥ 1，对同一 DOM 重复调用 `injectHeadingAnchors` n 次，断言：（a）每个带非空 id 的 heading 之后恰好一个 `.heading-anchor` sibling（重复调用不增加数量）；（b）每个 heading 元素自身的 `innerHTML` 与首次调用前一致（heading 内部未被改写）；（c）每个 `.heading-anchor` 的 `data-anchor` 属性等于其关联 heading 的 `id`
    - _Validates: Requirements 9.1, 9.2, 9.8_

- [ ] 13. Checkpoint - 阅读辅助能力闭环
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. 布局与主题样式
  - [ ] 14.1 新增 `src/css/career/blogView/themes.css`
    - 通过 `.reader-root[data-theme="light|dark"]` 定义 `--bg / --fg / --muted / --accent / --border` 等 CSS 变量
    - 通过 `.reader-root[data-font-size="sm|md|lg"] .blog-article` 缩放字号（15/17/19px）与行高（1.7/1.75/1.8）
    - _Requirements: 6.1, 6.2, 6.3, 6.7_

  - [ ] 14.2 新增 `src/css/career/blogView/codeHighlight.css`
    - 单文件承载明 / 暗两套 `.hljs` 调色板，选择器分别为 `.reader-root[data-theme="light"] .hljs` 与 `.reader-root[data-theme="dark"] .hljs`
    - 保证两种主题下代码块背景 / 前景对比度符合可读性要求
    - _Requirements: 4.5, 6.7_

  - [ ] 14.3 新增 `src/css/career/blogView/tocPanel.css`、`readingProgressBar.css`、`readerToolbar.css`、`backToTopButton.css`、`headingAnchor.css`
    - TocPanel：桌面右栏固定定位、字号跟随主题变量
    - TocPanel：新增 `.toc-toggle` / `.toc-toggle--leaf` 等宽占位样式（固定 `width` / `line-height`，切换 ▶ ↔ ▼ 时无横向抖动；`.toc-toggle--leaf` 设 `pointer-events: none` 且无 glyph）
    - TocPanel：每级递增 `padding-left` 阶梯（12–16px 一级，例如 `.toc-level-2` 无缩进、`.toc-level-3` 14px、`.toc-level-4` 28px）
    - TocPanel：折叠机制通过 `<ul.toc-children>` 的 mount / unmount 实现，不使用 CSS `height` / `max-height` 动画，避免与 activeId 更新竞态
    - TocPanel：`.toc-link.is-active` 高亮独立于折叠状态（`active` 条目被折叠父级隐藏时也保留类名）
    - ProgressBar：固定顶部、`width` 平滑过渡、填充色走 `--accent`
    - ReaderToolbar：右上角控件集群，位置不覆盖正文
    - BackToTopButton：`position: fixed; right: 24px; bottom: 96px`；通过 `[data-visible="false"] { opacity: 0; pointer-events: none; }` 与 `[data-visible="true"] { opacity: 1; pointer-events: auto; }` 切换可见性，`transition: opacity 0.2s ease`；颜色走 `--bg` / `--fg` / accent 变量，保证 light / dark 两种主题下对比度足够
    - HeadingAnchor：桌面端 `.blog-article .heading-anchor { opacity: 0 }` 默认隐藏，通过 `.blog-article :is(h2, h3, h4):hover + .heading-anchor { opacity: 1 }` 与 `.heading-anchor:hover / :focus-visible { opacity: 1 }` 悬停 / 聚焦时显示；`@media (max-width: 1024px)` 下 `.heading-anchor { opacity: 1 }` 常显；颜色走 `var(--muted)` 兼容两种主题
    - _Requirements: 3.2, 3.7, 3.8, 3.13, 5.1, 6.7, 7.2, 7.6, 9.3, 9.4_

  - [ ] 14.4 扩展 `src/css/career/blogView.css` 增加 `.reader-layout` 相关 selector
    - `.reader-layout` 三栏 grid：`grid-template-columns: 240px minmax(0, 1fr) 260px`；`.reader-layout--no-toc` 收缩为两栏
    - `@media (max-width: 1024px)` 单栏，左右栏隐藏（由父组件切换到 antd Drawer 承载）
    - 中间列 `minmax(0, 1fr)` + `.blog-article pre { overflow-x: auto; }` 防止宽代码块撑破布局
    - 只新增 selector，不修改已有 selector
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ] 14.5 新增 `src/pages/career/blogView/ReaderLayout.tsx`
    - Props：`left`、`center`、`right`、`hasToc`（决定 `--no-toc` 修饰类）
    - 桌面端渲染三栏 grid；`< 1024px` 时左右栏折叠为 antd `Drawer`，触发按钮位于顶栏
    - _Requirements: 3.2, 3.3, 5.4, 5.5, 5.6_

  - [ ] 14.6 运行 `npx gulp styles` 编译 CSS
    - 让 14.1–14.4 新增 / 扩展的 CSS 产出对应 `.min.css` 到项目约定路径
    - 修复过程中报出的 lint / 语法错误
    - _Requirements: 4.5, 5.4, 5.5, 5.6, 6.7_

- [ ] 15. 拼装 + 老博客兼容性回归
  - [ ] 15.1 改造 `src/pages/career/blogView/View.tsx` 集成所有新组件
    - 顶层用 `ReaderPreferencesProvider` 包裹整棵阅读子树
    - 顺序挂载：`ReadingProgressBar` → `ReaderToolbar` → `ReaderLayout`
    - ReaderLayout：左栏保持现有博客列表 / 时间线入口，中栏放 `BlogContentRenderer`，右栏放 `TocPanel`
    - 在父组件持有 `bodyRef = useRef<HTMLDivElement>(null)`，同时传给 `BlogContentRenderer` 与 `useToc`
    - 在父组件持有 `contentReady: boolean = useState(false)` state；通过 `<BlogContentRenderer ... onContentReady={() => setContentReady(true)} />` 让三步 pass 完成后翻转
    - 从 `useToc` 拿 `{ entries, activeId }` 并根据 `entries.length` 决定 `ReaderLayout` 的 `hasToc`
    - 挂载 `<LastReadTracker blogId={blog.id} contentReady={contentReady} activeId={activeId} />`（headless，放在 ReaderLayout 内即可）；用 `useLastReadPosition(blog.id)` 拿到的 `saveRecord` / `clearRecord` 传给 `BackToTopButton` 的 `onScrollTop`（例如 `onScrollTop={() => saveRecord({ headingId: null, scrollPercent: 0 })}`）
    - 挂载 `<BackToTopButton onScrollTop={...} />` 到 `ReaderLayout` 外层（相对视口 fixed）
    - 保持既有 Controller / Model 契约不变，改动限定在 View 层
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.4, 5.5, 6.1, 6.2, 6.3, 7.1, 8.3, 8.7, 9.1_

  - [ ]* 15.2 老 HTML 博客字节级兼容性回归
    - 在测试目录放置一份真实历史博客 HTML 作为 fixture
    - 挂载 `BlogContentRenderer` 后，触发 `useEffect`（三步 pass），按 heading 分别断言：对 fixture 中每个 h2/h3/h4，`renderedHeading.innerHTML === fixtureHeading.innerHTML`（heading 元素自身的内容未被改写）
    - 断言 heading-anchor sibling 结构：每个带非空 id 的 h2/h3/h4 的 `nextElementSibling` 是 `.heading-anchor` 且 `data-anchor === heading.id`；每个 heading 后恰好一个 `.heading-anchor`（无重复）
    - 额外断言：非空 h2/h3 现在都带上 id、`<pre><code>` 都带上了 `hljs` class、原有 `language-*` class 仍然保留
    - 断言 `useToc` 从该 fixture 抽出的目录条目集合非空且顺序正确
    - 断言 fixture 中若存在 h2/h3/h4，`buildTocTree(entries)` 得到的嵌套树 DFS 顺序（root → children 递归）等于文档中标题出现的顺序
    - _Requirements: 3.1, 4.1, 4.2, 4.4, 9.1, 9.2_

- [ ] 16. 最终 Checkpoint - 全量能力可交付
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- 标记 `*` 的子任务是可选测试任务，MVP 阶段可以跳过；核心实现子任务不能跳过
- 每个子任务都引用了对应的 requirement 子条款（例如 `2.5` 而非 `Requirement 2`），便于回溯到具体 AC
- Property 测试均使用 `fast-check`，每条 property 独立成一个子任务；example / 边界用例合并到相应实现任务的 `*` 单测里
- 兼容性风险集中在 `BlogContentRenderer`：15.2 的 fixture 按 heading 分别断言 + heading-anchor 结构断言是这条防线的兜底（HeadingAnchor 注入后 `article.innerHTML` 已不再逐字节等于原 HTML，但每个 heading 元素自身的 `innerHTML` 保持一致）
- CSS 新增 / 修改必须通过 `npx gulp styles` 编译（14.6），否则线上产物不会更新
- 阶段之间用 Checkpoint 分隔（任务 2 / 5 / 13 / 16），每次到达 Checkpoint 时同步跑一次全量测试
- 属性测试共覆盖 design.md 的 20 条 Correctness Properties
- 后端 `Blog` schema 与既有 CRUD 路由 / 前端 `blogApiRequest` 调用均不修改，历史博客零迁移

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "3.2", "6.1", "7.1", "8.1", "10.1", "11.1", "12.1", "14.1", "14.2", "14.3", "14.4", "14.5"] },
    { "id": 1, "tasks": ["1.2", "3.3", "4.1", "6.2", "6.3", "6.4", "7.2", "7.3", "7.5", "8.2", "8.3", "9.1", "10.2", "11.2", "11.3", "11.4", "14.6"] },
    { "id": 2, "tasks": ["4.2", "4.3", "7.4", "7.6", "7.7", "7.8", "9.2", "9.3", "9.4", "9.5", "10.3", "10.4", "11.5", "11.6", "12.2"] },
    { "id": 3, "tasks": ["15.1"] },
    { "id": 4, "tasks": ["15.2"] }
  ]
}
```
