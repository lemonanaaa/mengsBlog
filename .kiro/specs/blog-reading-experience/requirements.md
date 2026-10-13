# Requirements Document

## Introduction

本特性对现有博客系统的编辑与阅读体验进行升级。编辑侧保持 wangEditor 单一所见即所得方式（不引入 Markdown 语法），仅明确工具栏应具备的常用能力，并通过 wangEditor 原生的 `MENU_CONF.uploadImage.customUpload` 接入统一的图片上传通道，使按钮上传、剪贴板粘贴、文件拖拽三种触发方式共用同一后端接口。阅读侧新增目录导航、代码高亮、阅读进度、三栏排版与阅读偏好（字体大小 + 明暗主题）等能力。整体作为完整包一次性交付。

由于博客内容始终以 HTML 单一格式存储（wangEditor 输出），本特性不改动数据模型，历史博客天然向后兼容。本次范围还包含右侧悬浮返回顶部按钮、上次阅读位置记忆、章节锚点复制三项阅读辅助能力。

约束：

- 沿用现有 `blogApiRequest` 调用方式与 meng 模式鉴权行为
- 前端 CSS 修改后需通过 `npx gulp styles` 编译
- 博客内容存储格式保持为 HTML 字符串，不引入 `contentType` 字段

## Glossary

- **BlogSystem**: 博客整体系统，包含前端页面、后端 API 与数据存储
- **BlogEditor**: 博客编辑页面组件，基于 wangEditor 提供所见即所得编辑
- **BlogReader**: 博客阅读页面组件，负责渲染 HTML 正文与阅读辅助功能
- **ImageUploader**: 编辑器内负责图片上传的模块，通过 wangEditor `MENU_CONF.uploadImage.customUpload` 挂接，支持按钮点击 / 剪贴板粘贴 / 文件拖拽三种触发方式
- **UploadEndpoint**: 后端图片上传接口 `POST /api/blogs/upload-image`
- **TocPanel**: 阅读页右侧的目录导航面板（Table of Contents）
- **ProgressBar**: 阅读页顶部的阅读进度条组件
- **ReaderPreferences**: 用户在阅读页的偏好设置（字体大小、明暗主题），持久化在浏览器 localStorage 中
- **MengMode**: 系统的鉴权模式，控制博客编辑等特权操作
- **BlogApiRequest**: 项目中已有的统一 API 请求封装
- **BackToTopButton**: 阅读页右侧的悬浮返回顶部按钮
- **LastReadPosition**: 每篇博客独立记录的读者上次阅读位置（含 headingId 与滚动百分比），持久化在 localStorage
- **HeadingAnchor**: 章节锚点复制控件，追加在 H2/H3/H4 标题后，点击复制该章节的直达链接

## Requirements

### Requirement 1: wangEditor 工具栏能力保障

**User Story:** 作为博客作者（面向面试复习内容整理），我希望 wangEditor 的工具栏稳定提供整理技术笔记所必需的一组能力，以便无需依赖 Markdown 语法即可完成标题层级、代码示例、表格与图片链接等内容排版。

#### Acceptance Criteria

1. THE BlogEditor SHALL 使 wangEditor 工具栏包含标题 H1、H2、H3、H4 的插入能力。
2. THE BlogEditor SHALL 使 wangEditor 工具栏包含加粗与斜体两项文本样式能力。
3. THE BlogEditor SHALL 使 wangEditor 工具栏包含有序列表与无序列表两项能力。
4. THE BlogEditor SHALL 使 wangEditor 工具栏包含代码块能力，且允许作者为代码块指定编程语言。
5. THE BlogEditor SHALL 使 wangEditor 工具栏包含行内代码能力。
6. THE BlogEditor SHALL 使 wangEditor 工具栏包含引用块（blockquote）能力。
7. THE BlogEditor SHALL 使 wangEditor 工具栏包含图片插入能力，且该能力通过 ImageUploader 完成上传。
8. THE BlogEditor SHALL 使 wangEditor 工具栏包含超链接插入能力。
9. THE BlogEditor SHALL 使 wangEditor 工具栏包含表格插入能力。
10. WHEN 作者通过工具栏为代码块指定语言，THE BlogEditor SHALL 使 wangEditor 输出的 `<code>` 节点带有 `language-{lang}` class，以便阅读页高亮组件识别语言。

### Requirement 2: 统一图片上传（按钮 / 粘贴 / 拖拽）

**User Story:** 作为博客作者，我希望在 wangEditor 中通过点击图片按钮、剪贴板粘贴或拖拽三种方式插入图片，以便快速添加图片资源，且所有方式共用同一上传通道。

#### Acceptance Criteria

1. THE BlogEditor SHALL 通过 wangEditor `MENU_CONF.uploadImage.customUpload` 配置注册 ImageUploader，使工具栏按钮、剪贴板粘贴、文件拖拽三种图片来源均走同一上传入口。
2. WHEN 作者点击工具栏图片按钮并选择本地图片文件，THE ImageUploader SHALL 将该图片通过 BlogApiRequest 上传至 UploadEndpoint。
3. WHEN 作者在编辑器区域触发剪贴板粘贴事件且剪贴板包含图片数据，THE ImageUploader SHALL 将该图片通过 BlogApiRequest 上传至 UploadEndpoint。
4. WHEN 作者将本地图片文件拖拽释放到编辑器区域，THE ImageUploader SHALL 将该图片通过 BlogApiRequest 上传至 UploadEndpoint。
5. WHEN ImageUploader 收到 UploadEndpoint 返回的图片 URL，THE ImageUploader SHALL 调用 wangEditor 提供的插入回调，在光标位置插入 `<img>` 节点并使用该 URL 作为 src。
6. IF 图片上传请求失败（网络错误或后端返回非 2xx），THEN THE ImageUploader SHALL 向作者展示错误提示，且不在编辑器中插入任何图片节点。
7. IF 待上传文件的 MIME 类型不属于图片类型，THEN THE ImageUploader SHALL 阻止上传并向作者展示不支持的文件类型提示。
8. IF 当前会话不满足 MengMode 鉴权要求，THEN THE BlogEditor SHALL 保持与升级前一致的鉴权拦截行为，图片上传不因新增该配置而放宽鉴权。

### Requirement 3: 阅读页 TOC 自动生成与滚动跟随

**User Story:** 作为博客读者，我希望阅读长文时能看到自动生成的目录并知道自己当前正在阅读的章节，以便在文章内快速定位与跳转，并能按需折叠某些章节以专注于当前阅读的部分。

#### Acceptance Criteria

1. WHEN BlogReader 加载并渲染完成博客 HTML 正文，THE TocPanel SHALL 从渲染后的 HTML 正文 DOM 中提取所有 H2、H3、H4 标题构建目录树。
2. WHERE 视口宽度大于等于桌面端断点，THE TocPanel SHALL 以固定定位形式展示在阅读页右侧。
3. WHERE 视口宽度小于桌面端断点，THE TocPanel SHALL 折叠为抽屉式面板，仅在读者主动触发时展开。
4. WHEN 读者点击 TocPanel 中的任一条目，THE BlogReader SHALL 以平滑滚动方式将对应章节标题滚入视口。
5. WHILE 读者在正文中滚动阅读，THE TocPanel SHALL 使用 IntersectionObserver 实时高亮当前进入视口的最靠前章节条目。
6. IF 博客正文不包含任何 H2、H3 或 H4 标题，THEN THE TocPanel SHALL 隐藏自身且不在阅读页占用布局空间。
7. THE TocPanel SHALL 按标题层级嵌套渲染目录树，其中 H2 作为顶层节点、H3 作为对应 H2 的子节点、H4 作为对应 H3 的子节点。
8. THE TocPanel SHALL 为每一个含有子节点的目录条目显示可点击的折叠 / 展开控件。
9. WHEN 读者点击某个目录条目的折叠控件，THE TocPanel SHALL 切换该条目子节点在 TocPanel 内的可见性。
10. THE TocPanel SHALL 在目录首次渲染时使所有层级默认处于展开状态。
11. THE TocPanel SHALL 使目录条目的折叠状态仅影响 TocPanel 内子条目的可见性，不影响正文内容或 activeId 计算。
12. IF 当前 activeId 对应的条目位于某个被折叠的父级下，THEN THE TocPanel SHALL 保持该父级折叠状态不变，且在该 activeId 变化时继续正常运行不抛出错误。
13. THE TocPanel SHALL 使叶子条目（无子节点的目录条目）不显示折叠控件。

### Requirement 4: 代码块语法高亮

**User Story:** 作为博客读者，我希望博客中的代码块带有语法高亮，以便更容易阅读代码示例。

#### Acceptance Criteria

1. WHEN BlogReader 渲染完成博客 HTML 正文，THE BlogReader SHALL 对正文中的所有 `<pre><code>` 节点应用 highlight.js 高亮。
2. WHERE `<code>` 节点包含形如 `language-{lang}` 的 class，THE BlogReader SHALL 使用该 class 指定的语言执行高亮。
3. WHERE `<code>` 节点未包含 `language-*` class，THE BlogReader SHALL 使用 highlight.js 的自动语言识别或以纯文本样式渲染，且不抛出运行时错误。
4. THE BlogReader SHALL 在完成高亮后保留 wangEditor 原本输出的 `language-*` class，不擦除该 class。
5. THE BlogReader SHALL 使代码块在明色主题与暗色主题下均具备足够对比度的高亮配色。

### Requirement 5: 阅读进度条与三栏排版

**User Story:** 作为博客读者，我希望阅读时能看到顶部阅读进度条，并在宽屏下有清晰的三栏结构（左目录 / 中正文 / 右 TOC），以便获得更沉浸的长文阅读体验。

#### Acceptance Criteria

1. THE BlogReader SHALL 在阅读页顶部渲染 ProgressBar 用于展示当前阅读进度。
2. WHILE 读者在阅读页滚动，THE ProgressBar SHALL 依据正文滚动位置占正文总高度的比例更新宽度或填充比例。
3. WHEN 读者滚动到正文底部，THE ProgressBar SHALL 显示为 100% 完成状态。
4. WHERE 视口宽度大于等于桌面端断点，THE BlogReader SHALL 采用三栏布局：左栏为博客目录 / 章节树，中栏为正文，右栏为 TocPanel。
5. WHERE 视口宽度小于桌面端断点，THE BlogReader SHALL 采用单栏布局，正文占满可用宽度，左栏与右栏折叠为可触发展开的入口。
6. THE BlogReader SHALL 保证在三栏与单栏切换时正文内容不出现横向溢出。

### Requirement 6: 字体大小与明暗主题开关（本地持久化）

**User Story:** 作为博客读者，我希望能自定义阅读页的字体大小与明暗主题，并在下次访问时保留这些偏好，以便获得舒适的阅读体验。

#### Acceptance Criteria

1. THE BlogReader SHALL 提供字体大小调节控件，允许读者在小 / 中 / 大三档字号之间切换。
2. THE BlogReader SHALL 提供明暗主题切换控件，支持在 `light` 与 `dark` 两个主题之间切换。
3. WHEN 读者切换字体大小或主题，THE BlogReader SHALL 立即将新的样式应用到当前阅读页。
4. WHEN 读者切换字体大小或主题，THE BlogReader SHALL 将最新的 ReaderPreferences 写入浏览器 localStorage。
5. WHEN 读者下次打开任一博客阅读页且 localStorage 存在 ReaderPreferences，THE BlogReader SHALL 使用该偏好初始化字体大小与主题。
6. IF localStorage 中不存在 ReaderPreferences 或数据损坏，THEN THE BlogReader SHALL 回退到默认的中号字体与 `light` 主题。
7. THE BlogReader SHALL 使 ProgressBar、TocPanel 与代码块高亮在两种主题下均保持可读的对比度。

### Requirement 7: 返回顶部按钮

**User Story:** 作为博客读者，我希望在阅读长文时能通过一个悬浮按钮随时快速返回文章顶部，以便重新回到目录或对照总览。

#### Acceptance Criteria

1. THE BlogReader SHALL 在阅读页视口右侧渲染 BackToTopButton。
2. THE BackToTopButton SHALL 使用固定定位（相对视口），确保不遮挡正文与 TocPanel。
3. WHERE 当前窗口滚动位置小于视口高度的 50%，THE BackToTopButton SHALL 保持隐藏或以透明度 0 呈现。
4. WHERE 当前窗口滚动位置大于等于视口高度的 50%，THE BackToTopButton SHALL 可见。
5. WHEN 读者点击 BackToTopButton，THE BlogReader SHALL 以平滑滚动方式将窗口滚动到顶部（scrollTop = 0）。
6. THE BackToTopButton SHALL 在 light 与 dark 两种主题下均具备足够的视觉对比度。

### Requirement 8: 上次阅读位置记忆

**User Story:** 作为博客读者，我希望阅读被打断后，下次打开同一篇博客能自动跳到我上次读到的位置，以便无缝续读。

#### Acceptance Criteria

1. WHILE 读者在阅读页滚动，THE BlogReader SHALL 以至少 500ms 的防抖间隔记录当前 activeId 与整体滚动百分比作为 LastReadPosition。
2. THE BlogReader SHALL 将 LastReadPosition 按博客 id 为 key（例如 `blog-last-read-<blogId>`）写入浏览器 localStorage。
3. WHEN 读者打开某篇博客且 localStorage 存在该博客对应的 LastReadPosition，THE BlogReader SHALL 在正文渲染完成（含 injectHeadingIds 后）自动滚动到记录的位置。
4. WHERE 记录中包含有效的 headingId 且当前正文中存在该 id 的元素，THE BlogReader SHALL 优先按 headingId 定位。
5. WHERE 记录中不包含 headingId 或对应元素不存在，THE BlogReader SHALL 按记录的滚动百分比回填 window.scrollTop。
6. IF localStorage 中不存在该博客的 LastReadPosition 或数据损坏，THEN THE BlogReader SHALL 保持在正文顶部且不抛出错误。
7. WHEN 读者点击 BackToTopButton 回到顶部，THE BlogReader SHALL 将该博客的 LastReadPosition 更新为顶部位置（scrollPercent = 0、headingId 清空），避免下次打开再次跳回中间。
8. THE LastReadPosition 记录 SHALL 按博客独立存储，不同博客之间互不覆盖。

### Requirement 9: 章节锚点复制

**User Story:** 作为博客读者，我希望能一键复制某个章节的直达链接，以便把某个具体知识点的位置钉在笔记里或分享给别人。

#### Acceptance Criteria

1. WHEN BlogReader 完成 heading id 注入（injectHeadingIds），THE BlogReader SHALL 在每个 H2、H3、H4 标题后以可访问的方式追加 HeadingAnchor。
2. THE HeadingAnchor 的添加 SHALL 作为 additive DOM mutation 进行，不改变 heading 元素原有的文本内容与既有子节点结构。
3. WHERE 视口宽度大于等于桌面端断点，THE HeadingAnchor SHALL 仅在鼠标悬停对应标题时可见（默认隐藏或透明）。
4. WHERE 视口宽度小于桌面端断点，THE HeadingAnchor SHALL 始终可见。
5. WHEN 读者点击 HeadingAnchor，THE BlogReader SHALL 将 `<当前页完整 URL>#<heading id>` 写入剪贴板并展示“链接已复制”提示。
6. IF 浏览器的 `navigator.clipboard.writeText` 不可用，THEN THE BlogReader SHALL 退化到 `document.execCommand('copy')` 或等价的兜底方案，仍然向读者展示复制结果反馈。
7. IF 剪贴板写入操作抛出错误，THEN THE BlogReader SHALL 向读者展示复制失败提示且不影响页面其他功能。
8. THE HeadingAnchor SHALL 保持每个 heading 只有一份，重复触发 injectHeadingIds 不会导致多份 HeadingAnchor（幂等）。
