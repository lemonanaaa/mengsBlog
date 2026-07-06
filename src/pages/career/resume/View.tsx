import React from "react";

import Layout from "../../common/Layout";

import "../../../css/career/resume.css";

type Project = {
  name: string;
  highlight: string;
  intro: string;
  techPoints: string[];
  result: string;
};

const projects: Project[] = [
  {
    name: "新版供应商退款 / 退优惠",
    highlight: "事件订单比 8.39% → 4%，年省约 96.6 万",
    intro:
      "针对供应商退款 / 退优惠依赖 OP 人工处理且效率低的问题，建设 VBK 内商家自助处理能力，减少 OP 介入并提升效率。",
    techPoints: [
      "重构 VBK 退款 / 退优惠链路，支持商家自助取消资源、部分退款、退优惠，统一前端操作入口与弹窗交互。",
      "将金额计算与校验抽象到 Pure-Model，资源层与订单层组件复用。",
      "配置开关 + 白名单实现灰度发布与快速回滚。",
    ],
    result:
      "事件订单比预计由 8.39% 降至约 4%；预计年减少事件量约 48,289 单，节省服务成本约 96.6 万元 / 年，ROI 约 5.89。",
  },
  {
    name: "邮轮接入 VBK 系统",
    highlight: "费力度 ↓30%，咨询单一周增 10 倍",
    intro:
      "邮轮业务恢复后将独立系统订单数据接入主 VBK 系统，统一供应商操作与订单管理流程。",
    techPoints: [
      "跟团业务线适配改造，开关配置实现供应商准入与订单数据展示。",
      "列表 / 详情页重构，公共逻辑抽象至 Pure-Model，PC / H5 分别注入。",
      "流水线加入 MR 拦截与覆盖率门禁，结果同步 TP 群消息。",
    ],
    result:
      "费力度降低 30%，订单事件比降低约 0.55%；邮轮私家团咨询单量上线一周内增长约 10 倍。",
  },
  {
    name: "9072 新版工作台",
    highlight: "跳出率 ↓40%，Lighthouse 与 CPH 全面提升",
    intro:
      "基于埋点与热力图数据，为携程 9072 客服系统开发新版工作台，优化交互与首屏性能。",
    techPoints: [
      "升级 React-imvc 与 Antd 大版本，完成原系统适配改造。",
      "重构订单详情、订单快照、智能问答等核心模块。",
      "webpack 拆包、JS 懒加载、图片压缩优化首屏渲染。",
    ],
    result:
      "页面跳出率降低 40%（231% → 123%）；操作日志点击量降低 10%；各项 CPH 指标均有较大幅度提升。",
  },
  {
    name: "精准测试小工具",
    highlight: "携程年度程果奖，100+ 人日常使用",
    intro:
      "以 diff 代码为分母计算覆盖率，帮助研发聚焦本次改动的测试质量，而非全量口径。",
    techPoints: [
      "Jest istanbul 插桩追踪页面真实执行代码。",
      "diff-test-coverage 对比 patch，产出 diff 覆盖率。",
      "对接 testhub 与公共流水线，覆盖提测到发布全流程。",
      "完成 UI、数据结构设计与使用文档。",
    ],
    result: "提升研发自测效率；已接入多组日常开发发布流程。",
  },
];

const ResumeView = () => {
  return (
    <Layout>
      <article className="resume-doc">
        <header className="resume-doc-head">
          <h1>
            李萌
            <span className="resume-doc-title">高级前端工程师</span>
          </h1>
          <p className="resume-doc-meta">
            现居上海 ｜ lemonanaaa@163.com ｜ 13628069907
          </p>
          <p className="resume-doc-meta">
            四川大学 · 软件工程本科 ｜ 2017.09 - 2022.06
          </p>
        </header>

        <section className="resume-doc-section">
          <h2>工作经历</h2>
          <div className="resume-entry-head">
            <strong>携程 · 旅游 BG 高级前端工程师</strong>
            <span>2022.07 - 至今</span>
          </div>
          <ul className="resume-list">
            <li>
              负责 VBK 线路订单模块（跟团 / 邮轮 / 签证）；曾负责点评、9072、购物车模块。
            </li>
            <li>
              性能与架构优化、监控体系、单端多端同构、流水线维护；产出精准测试工具（100+ 人使用）与自动化测试 Chrome 插件。
            </li>
          </ul>
        </section>

        <section className="resume-doc-section">
          <div className="resume-section-head">
            <h2>项目经历</h2>
            <span className="resume-section-hint">点击可收起 / 展开</span>
          </div>

          <div className="resume-project-list">
            {projects.map((project, index) => (
              <details key={project.name} className="resume-project-item" open>
                <summary className="resume-project-summary">
                  <span className="resume-project-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="resume-project-name">{project.name}</span>
                  <span className="resume-project-highlight">{project.highlight}</span>
                  <span className="resume-project-toggle" aria-hidden="true" />
                </summary>
                <div className="resume-project-body">
                  <p className="resume-project-intro">
                    <em>项目介绍</em> {project.intro}
                  </p>
                  <p className="resume-label">技术点</p>
                  <ol className="resume-list resume-list-ordered">
                    {project.techPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ol>
                  <p className="resume-project-result">
                    <em>项目成果</em> {project.result}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="resume-doc-section resume-doc-section-last">
          <h2>校园经历</h2>
          <p className="resume-plain">
            <em>竞赛 ｜ 科研</em> 在校期间获国家级 / 省级创新创业赛事奖项，完成多项软件著作权与论文成果。
          </p>
        </section>
      </article>
    </Layout>
  );
};

export default ResumeView;
