// 「工程实践」Tab 的数据：研发全流程各环节 + 挂在环节上的实践
// 碎片化增长：想到一条就往 PRACTICES 里加一条，对应环节自动"点亮"。

export type PracticeCategory =
  | "foundation"
  | "mcp"
  | "skills"
  | "hooks"
  | "practice";

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
}

// 底座：贯穿所有应用的认知基础
export const FOUNDATION_CATEGORY: CategoryMeta = {
  key: "foundation",
  label: "Agent 基础",
  icon: "🧠",
  hint: "架构 · Context · MCP / Skills / Hooks 的取舍",
};

// Agent 能力维度（前端视角：我怎么用、怎么沉淀）
export const CATEGORIES: CategoryMeta[] = [
  { key: "mcp", label: "MCP 应用", icon: "🔌", hint: "常用 MCP · 浏览器自动化" },
  { key: "skills", label: "Skills & 工作流", icon: "📜", hint: "把重复经验固化成技能" },
  { key: "hooks", label: "Hooks 自动化", icon: "🪝", hint: "生命周期卡点 · 统计 · 看板" },
  { key: "practice", label: "提效实战", icon: "⚡", hint: "性能优化 · 排障等真实案例" },
];

const CODE_CHANGE_WORKFLOW = `> **核心原则：不要一上来就写代码。** 先定义目标行为和成功标准，再测试、实现、验证、审查、提交、推送并观察结果。

## 何时使用

只要可能改动仓库里的文件就用它：修 bug、加功能、UI / 交互调整、重构、改测试、构建 / 部署 / 配置、依赖更新。

不适用：只读调查、纯解释性问题、代码库之外的一次性数据分析。

## 11 步工作流

1. **理解需求** — 重述问题或功能，查看相关文件与当前行为，检查 Git 状态。
2. **定义成功标准** — 写代码前先明确预期行为、边界情况、测试点、人工检查项，以及"不做什么"。
3. **制定任务计划** — 复杂任务维护一份步骤清单（排查 → 测试 → 实现 → 验证 → 审查 → 提交 → 推送 → 观察）。
4. **尽量 TDD** — 先写一个会失败的测试，再做最小修复让它通过。
5. **最小化实现** — 只改必要内容，避免无关重构、无关文件，以及偷偷改变产品行为。
6. **分层验证** — 先跑针对性测试，再跑更大范围测试、lint、类型检查、构建。
7. **本地人工测试** — 界面 / 应用流程要打开真实页面、执行真实用户操作，并检查浏览器控制台。
8. **独立审查** — 审 \`git diff\`、确认改动范围、检查密钥泄露；重要改动做第二轮 review。
9. **干净提交** — 只暂存目标文件，用清晰、规范的提交信息。
10. **推送并建 PR** — 验证通过后再推；PR 写明总结、测试、人工验证、截图与限制。
11. **观察 CI 与部署** — 看失败日志、修复、重推，必要时校验部署结果。

## TDD：红 → 绿 → 重构

- **红**：写一个失败的测试，证明问题真实存在。
- **绿**：做最小且安全的修改，让测试通过。
- **重构**：通过后再清理，测试守护未来不回归。

## 验证清单（说"完成"前逐条确认）

- 已理解需求、已检查 Git 分支与状态
- 已定义成功标准
- 已写失败测试，或说明为何不适用
- 已完成最小实现
- 针对性测试通过；相关完整测试通过或记录失败原因
- lint / 类型检查 / 构建通过，或记录限制
- 如涉及界面：已人工测试并检查控制台
- 已审查 diff 的范围与密钥
- 重要改动已独立 review
- 目标文件已提交；如需要已推送 / 建 PR
- 如适用：已检查 CI 与部署

## 常见坑

- **过早写代码**：没定义行为就动手，通常返工。
- **没有回归测试**：没测试的修复，未来可能悄悄坏掉。
- **只测顺利路径**：边界与失败态同样重要。
- **提交无关文件**：务必检查 diff、只暂存目标文件。
- **本地 ≠ 线上**：涉及线上要验证生产或预览环境。
- **不跟进 CI**：推送后要看自动化检查与部署。

## "完成"的定义

"完成" = 已验证、已审查、可安全交付。汇报时说明：改了什么、改了哪些文件、做了哪些测试与结果、构建 / 检查结果、人工验证、review 发现、提交 / PR 状态、遗留风险。`;

const MCP_TOOLBOX = `> MCP 是在运行时把外部工具的"说明书"注入给 Agent。强大，但吃 token——按需开、用完关。

## 我高频在用的几个

- **feishu2md** — 飞书文档读写。读文档喂给 Agent 当上下文非常好用；写入建议用 always-user，以个人身份写，避免租户级的权限管控问题。
- **gitlab-mcp** — 提 MR。搭配一个"提 MR"的 Skill，把分支命名、MR 模板、idev 号这套流程固化下来。
- **figma / pencil** — figma 做设计稿转结构、样式对齐（需要 dev mode 权限）；pencil 做原型 / 交互稿生成。
- **DOT** — 关系型数据库 / MongoDB 查询，排查数据问题时直接让 Agent 去查。
- **chrome-devtools** — 浏览器自动化 & 深度调试（见"CDP 性能优化与排障"那篇）。

## 用的时候注意

- **token 开销**：一个 MCP Server 的工具定义每轮都会注入系统提示，可能占 10k–20k tokens。
- **按需加载**：开启 Tool Search（\`ENABLE_TOOL_SEARCH=true\`）可省 40%–95% 开销。
- **用完就关**：不删配置也能停用——会话级 \`claude mcp disable <name>\`，或用白 / 黑名单控制。

## 一点心得

MCP 不是越多越好。能用 Skill + CLI 解决的，往往比挂一个重 MCP 更省 token。挂之前先问自己：这个能力我是不是高频用？`;

const CDP_PERF_DEBUG = `> 把"F12 看网络 → 截图 / 复制 curl → 贴给 AI → 分析 → 手动改"这条老链路，收敛成"AI 直接观测 → 分析 → 写代码"。

## 它解决什么

传统排障 / 性能优化，人要在浏览器和 AI 之间反复搬运信息。接上 Chrome DevTools MCP（CDP）后：

- **零拷贝** — 不用截图、复制 curl，Agent 直接看到原始网络请求和 trace 数据。
- **带登录态** — 用你自己的浏览器 session，内网页面直接可达。
- **闭环** — 观测 → 分析 → 写代码，一个对话内完成。

## 两个实战场景

### 性能优化

用到 \`performance_start_trace\`（含 reload + autoStop）、\`performance_analyze_insight\`（分析 RenderBlocking / LCP / CLS / ForcedReflow）、\`lighthouse_audit\` 拿分数。跑的时候不用打开 DevTools 面板，CDP 通过 WebSocket 直连 Chrome 内核。

### 页面排障（/page-debug）

产研测给一个 URL 问"为什么长这样、是不是 bug"，以前得停下手上活、另起项目 debug。现在用 \`list_network_requests\` 拿到真实接口数据，配一个 \`/page-debug\` Skill，把 URL + 仓库 + 问题描述丢给 Agent，它自己定位到底是前端问题还是数据问题。

## 下一步

把 \`/page-debug\` 做到开箱即用：一步装好 CDP MCP + 环境初始化，问题描述更简单、更面向 Agent，提升准确性与稳定性。`;

export const PRACTICES: Practice[] = [
  {
    id: "code-change-workflow",
    title: "代码修改工作流",
    category: "skills",
    icon: "🔄",
    summary: "清晰、安全、测试优先的代码修改流程：先定义行为与成功标准，再动手。",
    status: "published",
    content: CODE_CHANGE_WORKFLOW,
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
  {
    id: "cdp-perf-debug",
    title: "CDP 性能优化与排障",
    category: "practice",
    icon: "🔍",
    summary: "用 Chrome DevTools MCP 把「观测 → 分析 → 改代码」收敛到一个对话里。",
    status: "published",
    content: CDP_PERF_DEBUG,
  },
];

export const getPublishedPractices = (category: PracticeCategory): Practice[] =>
  PRACTICES.filter((p) => p.category === category && p.status === "published");

export const isCategoryLit = (category: PracticeCategory): boolean =>
  PRACTICES.some((p) => p.category === category && p.status === "published");
