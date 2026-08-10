// 「工程实践」Tab 的数据：Agent 基础、MCP、Skill、工作流。

export type PracticeCategory =
  | "foundation"
  | "mcp"
  | "skills"
  | "workflow";

export interface CategoryMeta {
  key: PracticeCategory;
  label: string;
  icon: string;
  hint: string; // 一句话说明这一类是什么
}

export interface Practice {
  id: string;
  title: string;
  category: PracticeCategory;
  icon: string;
  summary: string;
  status: "published" | "planned";
  content?: string; // markdown 正文，展开后站内阅读
  link?: { href: string; label: string };
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "foundation",
    label: "Agent 相关基础知识",
    icon: "🧠",
    hint: "Claude Code 能力分层与 MCP / Skill 分工",
  },
  { key: "mcp", label: "MCP", icon: "🔌", hint: "连接研发工具与业务平台" },
  { key: "skills", label: "Skill", icon: "📜", hint: "把团队经验固化成可复用能力" },
  { key: "workflow", label: "工作流", icon: "🔄", hint: "让复杂研发任务稳定交付" },
];

const CODE_CHANGE_WORKFLOW = `> **核心原则：不要一上来就写代码。** 先定义成功标准，再最小实现、分层验证、审查 diff；提交 / 推送 / 部署需明确授权。

Agent 改仓库代码时的基本路径：理解需求 → 测试优先 → 最小改动 → 验证与审查 → 按需交付。

完整步骤、风险分档、验证清单和汇报模板见右上角链接。`;

const TEST_RELEASE_WORKFLOW = `从测试环境发布到生产上线的一条固定路径：插桩记录改动 → TestHub 规划用例 → 插桩包自测 → 看报告补覆盖 → 再发生产。

## 流程概览

\`\`\`
@小助手发测试 → 插桩发布 → TestHub 建计划 → 插桩包自测 → 报告查缺口 → 达标后发生产
\`\`\`

## 具体步骤

1. **发起测试发布** — 在发布群里 @小助手，说明分支与需求，走测试环境发布流程。
2. **插桩发布** — 使用带测试插桩记录的发布方式，把本次改动与测试过程关联起来，方便事后核对「测了哪些代码、漏了哪些」。
3. **TestHub 建计划** — 在 TestHub 新建或更新测试计划，按本次改动范围规划用例，明确要测的功能点与预期。
4. **插桩模式自测** — 在插桩模式打包下发的环境里按 TestHub 计划执行自测，优先覆盖本次 diff 触达的页面与分支。
5. **看报告补覆盖** — 对照测试报告和插桩记录，找出未覆盖或未执行的改动，补测并提升覆盖率到团队要求的标准。
6. **发布生产** — 自测与覆盖率达标后，再走生产发布流程。

## 和代码修改工作流的关系

代码修改工作流解决「怎么改、怎么验」；这条解决「改完怎么发、怎么在测试环境把改动测全再上线」。两者衔接：本地 / CI 验证通过后，进入本流程做环境级自测与发布。`;

const MCP_TOOLBOX = `## 高频使用的MCP

- **feishu2md** — 飞书文档读写。读文档喂给 Agent 当上下文非常好用；写入建议用 always-user，以个人身份写，避免租户级的权限管控问题。
- **gitlab-mcp** — 提 MR。搭配一个"提 MR"的 Skill，把分支命名、MR 模板、idev 号这套流程固化下来。
- **figma / pencil** — figma 做设计稿转结构、样式对齐（需要 dev mode 权限）；pencil 做原型 / 交互稿生成。
- **chrome-devtools** — 让 Agent 直接读取页面 DOM、网络请求和性能 trace，完成浏览器自动化、排障与性能分析。
- **TestHub** — 连接测试用例平台：查询测试库、模块和已有用例，读取步骤与预期，也能创建用例、补充步骤、更新用例。它让“需求 → 测试代码 → 用例文档 → TestHub caseId”保持可追溯，而不是写完自动化后再手工搬运。

## 用的时候注意

- **token 开销**：一个 MCP Server 的工具定义每轮都会注入系统提示，可能占 10k–20k tokens。
- **按需加载**：开启 Tool Search（\`ENABLE_TOOL_SEARCH=true\`）可省 40%–95% 开销。
- **用完就关**：不删配置也能停用——会话级 \`claude mcp disable <name>\`，或用白 / 黑名单控制。

## 一点心得

MCP 不是越多越好。能用 Skill + CLI 解决的，往往比挂一个重 MCP 更省 token。挂之前先问自己：这个能力我是不是高频用？`;

const TEAM_SKILLS = `## mom2code：SOA 接口契约拉取

做前端设计或写接口调用前，用 mom2code 把 SOA 契约拉到 \`src/dal/\`，以 \`RequestType.ts\` / \`ResponseType.ts\` 为准，而不是猜字段或照抄旧代码。

1. 从 PRD、后端设计或 \`controller\` 里的 \`/<appId>/<operationName>\` 识别接口。
2. \`dtk fetch <appId>/<operationName>\` 拉最新；后端给了版本号时加 \`-r <版本>\`。
3. 读生成契约后再写 types、service 和设计文档里的字段说明；已知接口在设计阶段就直接拉，对齐后再把 TODO 标为已确认。
4. **不要盲信契约**：实际返回是 \`ResponseStatus\`（大写 R），\`Ack\` 是 \`"Success" | "Failure" | "Warning"\` 字符串枚举，不是 \`responseStatus.Ack === 1\`。

## shark-i18n-submit：多语言文案提取与提交

对比 git diff 找出新增硬编码中文，按 Shark 命名规则生成 key、上传到平台，再把代码替换为 \`getEasyShark\` / \`getShark\` 调用。

和已有的「翻译检查」Skill 不同：那个从 diff 提取已有 key、验 CDN 英文是否缺失；这个负责建 key、提交、改代码。

1. diff 筛出本次改动中的中文文案。
2. 按 \`key.tour.{pageName}.{语义}\` 等规范命名，优先复用已有 key。
3. 将 key 与翻译提交到 Shark 平台。
4. 把硬编码中文改为 Shark 调用。

## write-page-unit-test：页面自动化测试

面向 React IMVC 页面的一套 Jest 单测工作流，组合 Testing Library、Controller 渲染链路、MockFetch 和 TestHub MCP：

1. 先确认 TestHub 测试库与模块，拉取已有用例及步骤，避免重复造用例。
2. 先渲染页面并输出 DOM 快照，再定义统一的 \`PageTestId\`，避免靠猜测写脆弱选择器。
3. 按“基本展示 + 分支覆盖”组织测试，复用 mock 数据工厂，覆盖交互、弹窗、边界和异常分支。
4. 检查分支与行覆盖率；仅为缺口补充新用例。
5. 生成面向人工测试的用例文档，通过 TestHub MCP 上传，并把 caseId 回写到测试代码和文档。

它把“分析页面 → 写测试 → 补覆盖率 → 沉淀平台用例”收敛成一个可追踪的闭环。`;

export const PRACTICES: Practice[] = [
  {
    id: "code-change-workflow",
    title: "代码修改工作流",
    category: "workflow",
    icon: "🔄",
    summary: "清晰、安全、测试优先的代码修改流程：先定义行为与成功标准，再动手。",
    status: "published",
    content: CODE_CHANGE_WORKFLOW,
    link: {
      href: "/code-change-workflow-presentation.html",
      label: "完整版代码修改工作流",
    },
  },
  {
    id: "stake-release-self-check",
    title: "插桩发布与自测上线",
    category: "workflow",
    icon: "🚀",
    summary: "测试环境插桩发布 → TestHub 规划自测 → 报告查缺口 → 达标后发生产。",
    status: "published",
    content: TEST_RELEASE_WORKFLOW,
  },
  {
    id: "team-skills",
    title: "常用 Skills",
    category: "skills",
    icon: "🧩",
    summary: "mom2code 契约拉取、Shark 多语言与页面自动化测试：把团队经验沉淀成可执行流程。",
    status: "published",
    content: TEAM_SKILLS,
  },
  {
    id: "mcp-toolbox",
    title: "常用 MCP 工具箱",
    category: "mcp",
    icon: "🧰",
    summary: "日常在 Claude Code 里高频使用的几个 MCP，各自的真实用途与踩坑点。",
    status: "published",
    content: MCP_TOOLBOX,
  },
];

export const getPublishedPractices = (category: PracticeCategory): Practice[] =>
  PRACTICES.filter((p) => p.category === category && p.status === "published");

export const isCategoryLit = (category: PracticeCategory): boolean =>
  category === "foundation" ||
  PRACTICES.some((p) => p.category === category && p.status === "published");
