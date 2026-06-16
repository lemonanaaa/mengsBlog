import React from "react";

import Layout from "../../common/Layout";

import '../../../css/career/resume.css';

const ResumeView = () => {
  const projects = [
    {
      name: "新版供应商退款 / 退优惠",
      background:
        "供应商退款/退优惠长期依赖 OP 人工处理，链路长、效率低、易出错，且跨端逻辑重复导致迭代成本高。",
      role: "前端核心开发，负责业务链路改造、跨端复用方案与灰度发布策略设计。",
      challenges: [
        "退款/退优惠规则复杂，金额计算与校验条件多，历史逻辑分散。",
        "PC 与 H5 端交互形态不同，但核心规则一致，重复开发成本高。",
        "业务高峰期必须保证可回滚，不能一次性全量切换。"
      ],
      solution: [
        "统一前端操作入口与弹窗交互，支持供应商自助取消资源、部分退款、退优惠。",
        "将金额计算与校验等核心逻辑抽象到 Pure-Model，资源层与订单层组件复用。",
        "通过配置开关 + 白名单机制做分批放量，确保问题可快速回滚。"
      ],
      result:
        "事件订单比由预计 8.39% 降至约 4%；预计年减少事件量约 48,289 单，节省服务成本约 96.6 万元 / 年，ROI 约 5.89。"
    },
    {
      name: "邮轮接入 VBK 系统",
      background:
        "疫情后邮轮业务恢复，原系统独立运行，无法复用 VBK 现有流程与能力，协作成本高。",
      role: "核心开发，负责订单列表/详情重构、跨端复用与发布质量门禁方案。",
      challenges: [
        "邮轮业务流程与既有跟团线路差异较大，直接接入存在兼容问题。",
        "历史页面存在重复逻辑，改造时需要兼顾上线节奏和稳定性。",
        "发布链路缺乏覆盖率门禁，质量风险较高。"
      ],
      solution: [
        "做业务线适配改造，通过开关准入供应商并控制功能可见范围。",
        "重构列表页和详情页，抽离公共逻辑到 Pure-Model，实现 PC/H5 双端复用。",
        "在流水线中加入 MR 拦截与覆盖率门禁，并同步质量结果到群消息。"
      ],
      result:
        "费力度降低约 30%，订单事件比降低约 0.55%，邮轮私家团咨询单上线一周增长约 10 倍。"
    },
    {
      name: "9072 新版工作台",
      background:
        "9072 客服系统旧版 UI 使用多年，交互效率和性能表现无法满足新阶段运营需求。",
      role: "核心开发，负责新版 UI 关键模块交付与性能优化专项。",
      challenges: [
        "系统历史包袱重，升级 React-imvc 与 Antd 大版本存在较高改造成本。",
        "客服场景信息密度高，模块升级要兼顾效率与学习成本。",
        "首屏性能瓶颈明显，需要在不影响业务迭代的情况下优化。"
      ],
      solution: [
        "完成 React-imvc 与 Ant Design 大版本升级，统一组件能力与交互规范。",
        "重构订单详情、订单快照、智能问答等关键模块，提高操作效率。",
        "通过 webpack 拆包、延迟加载与图片压缩等手段优化首屏渲染。"
      ],
      result:
        "Lighthouse 指标提升，页面跳出率降低约 40%，新版操作日志点击量下降约 10%，售后 CPH 指标提升。"
    },
    {
      name: "精准测试小工具",
      background:
        "传统覆盖率口径以全量代码为分母，难以精准评估当前改动的测试质量与发布风险。",
      role: "方案设计与核心开发，负责覆盖率计算链路、平台接入和落地推广。",
      challenges: [
        "需要准确识别真实执行代码，并与 diff 变更建立可追溯映射。",
        "工具方案要兼容现有测试平台和流水线，减少团队迁移成本。",
        "推广期需要可视化结果和使用文档，确保团队能快速接入。"
      ],
      solution: [
        "基于 Istanbul 插桩统计页面真实执行代码，形成原始覆盖数据。",
        "结合 diff-test-coverage 对比 patch，产出以 diff 为分母的覆盖率。",
        "接入测试平台与公共流水线，覆盖提测到测试发布全流程并沉淀文档。"
      ],
      result:
        "显著提升研发自测效率，项目获携程集团年度程果奖，已推广到多个组日常开发发布流程。"
    }
  ];

  const highlights = [
    "3+ 年前端工程经验，长期负责核心订单业务能力建设",
    "有复杂业务链路改造与跨端复用落地经验（PC/H5）",
    "持续推进工程质量建设（流水线门禁、精准测试、可观测性）"
  ];

  const coreSkills = [
    "React",
    "TypeScript",
    "JavaScript",
    "Ant Design",
    "Webpack",
    "Jest",
    "CI/CD",
    "Pure-Model"
  ];

  return <Layout>
    <div className="resume-page">
      <section className="resume-hero">
        <h1>李萌 - 前端工程师</h1>
        <p className="resume-meta">现居上海 ｜ lemonanaaa@163.com ｜ 13628069907</p>
        <p className="resume-meta">四川大学 软件工程 本科（2017.09 - 2022.06）</p>
        <div className="resume-highlight-list">
          {highlights.map((item) => (
            <span key={item} className="resume-highlight-item">{item}</span>
          ))}
        </div>
      </section>

      <section className="resume-section">
        <h2>核心技能</h2>
        <div className="resume-skill-tags">
          {coreSkills.map((skill) => (
            <span key={skill} className="resume-skill-tag">{skill}</span>
          ))}
        </div>
      </section>

      <section className="resume-section">
        <h2>工作经历</h2>
        <article className="resume-card">
          <div className="resume-card-header">
            <h3>携程 - 旅游BG 高级前端工程师</h3>
            <span>2022.07 - 至今</span>
          </div>
          <ul>
            <li>负责 VBK 线路订单模块，覆盖跟团游、邮轮、签证等业务线订单相关操作能力建设。</li>
            <li>持续推进性能优化、架构治理、监控配置、仓库流水线维护和技术文档沉淀。</li>
            <li>曾负责 VBK 点评、9072 系统、购物车部分业务。</li>
          </ul>
        </article>
      </section>

      <section className="resume-section">
        <h2>项目经历（详细版）</h2>
        {projects.map((project) => (
          <article key={project.name} className="resume-card resume-project-card">
            <h3>{project.name}</h3>
            <p><strong>项目背景：</strong>{project.background}</p>
            <p><strong>个人职责：</strong>{project.role}</p>

            <div className="resume-project-grid">
              <div>
                <p className="resume-sub-title">核心难点</p>
                <ul>
                  {project.challenges.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="resume-sub-title">解决方案</p>
                <ul>
                  {project.solution.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="resume-result-box">
              <strong>项目成果：</strong>
              <span>{project.result}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="resume-section">
        <h2>校园经历</h2>
        <article className="resume-card">
          <p>在校期间获国家级 / 省级创新创业赛事奖项，完成多项软件著作权与论文成果。</p>
        </article>
      </section>
    </div>
  </Layout>;
};

export default ResumeView;




