import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";
import "../../css/frontPage/frontPage.css";

type GuideCard = {
  key: string;
  icon: string;
  title: string;
  pillLabel: string;
  desc: string;
  path: string;
  tint: string;
  staticPage?: boolean;
};

const guideCards: GuideCard[] = [
  {
    key: "resume",
    icon: "📄",
    title: "简历",
    pillLabel: "简历",
    desc: "完整工作经历、项目背景与成果指标，适合投递或面试前快速了解",
    path: "/career/resume",
    tint: "tint-purple",
  },
  {
    key: "detail",
    icon: "🧭",
    title: "项目介绍",
    pillLabel: "项目介绍",
    desc: "技能栈、工作经历、项目实践与技术内容的完整展示",
    path: "/career/detail",
    tint: "tint-pink",
  },
  {
    key: "tree",
    icon: "🌳",
    title: "知识树",
    pillLabel: "知识树",
    desc: "按主题整理的能力地图，展示业务、工程化与稳定性方向的结构",
    path: "/career/blogsTree",
    tint: "tint-mint",
  },
  {
    key: "workflow",
    icon: "🔄",
    title: "代码修改工作流",
    pillLabel: "工作流",
    desc: "清晰、安全、测试优先的代码修改流程，适合演示或导出 PDF",
    path: "/code-change-workflow-presentation.html",
    tint: "tint-blue",
    staticPage: true,
  },
];

const mengGuideCards: GuideCard[] = [
  {
    key: "journal",
    icon: "✍️",
    title: "Meng's 碎碎念",
    pillLabel: "碎碎念",
    desc: "私人日记，记录一些不想对外公开的小想法",
    path: "/writing",
    tint: "tint-lavender",
  },
];

const profileSnapshot = {
  title: "背景速览",
  summary: "携程 4 年 Web 前端 · 复杂 C 端 · 工程化与性能优化",
  tags: ["复杂业务", "性能 & 稳定性", "AI 应用探索"],
};

const FrontPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);
  const isMeng = searchParams.get('meng') === 'true';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const scrollToGrid = () => {
    document.getElementById("front-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  const openGuideCard = (card: GuideCard) => {
    if (card.staticPage) {
      window.location.href = card.path;
      return;
    }
    navigateWithMeng(card.path);
  };

  const visibleCards = isMeng ? [...guideCards, ...mengGuideCards] : guideCards;

  return (
    <Layout>
      <div className={`front-page${ready ? " front-page--ready" : ""}`}>
        <div className="front-page-bg" aria-hidden="true">
          <span className="front-blob front-blob-1" />
          <span className="front-blob front-blob-2" />
          <span className="front-blob front-blob-3" />
        </div>

        <header className="front-topbar front-animate" style={{ "--delay": "0.05s" } as React.CSSProperties}>
          <span className="front-logo">Meng</span>
          <p className="front-topbar-note">
            <span className="front-topbar-dot" aria-hidden="true" />
            前端作品集
          </p>
        </header>

        <div className="front-main">
          <section className="front-left">
            <span className="front-badge front-animate" style={{ "--delay": "0.12s" } as React.CSSProperties}>
              前端工程师 · 上海
            </span>
            <h1 className="front-title front-animate" style={{ "--delay": "0.2s" } as React.CSSProperties}>
              Meng
            </h1>
            <p className="front-tagline front-animate" style={{ "--delay": "0.28s" } as React.CSSProperties}>
              Build things that work.
            </p>
            <p className="front-desc front-animate" style={{ "--delay": "0.36s" } as React.CSSProperties}>
              你好，我是李萌。这是个人作品集，展示工作经历、项目实践与技术思考。
              建议从「简历」开始，快速了解我的背景。
            </p>
            <div className="front-actions front-animate" style={{ "--delay": "0.44s" } as React.CSSProperties}>
              <button
                type="button"
                className="front-btn front-btn-primary"
                onClick={() => navigateWithMeng("/career/resume")}
              >
                <span>简历</span>
                <span className="front-btn-arrow" aria-hidden="true">↗</span>
              </button>
              <button
                type="button"
                className="front-btn front-btn-secondary"
                onClick={scrollToGrid}
              >
                作品集入口
              </button>
            </div>

            <div className="front-profile-strip front-animate" style={{ "--delay": "0.52s" } as React.CSSProperties}>
              <div className="front-profile-strip-title">{profileSnapshot.title}</div>
              <p className="front-profile-summary">{profileSnapshot.summary}</p>
              <div className="front-profile-tags">
                {profileSnapshot.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className="front-profile-tag"
                    style={{ "--delay": `${0.58 + index * 0.08}s` } as React.CSSProperties}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="front-right">
            <div className="front-grid-header front-animate" style={{ "--delay": "0.3s" } as React.CSSProperties}>
              <div className="front-grid-header-text">
                <span className="front-grid-header-label">作品集入口</span>
                <span className="front-grid-header-hint">{visibleCards.length} 个模块 · 点击进入</span>
              </div>
              <div className="front-grid-header-legend" aria-hidden="true">
                {visibleCards.map((card) => (
                  <span key={card.key} className={`front-grid-header-dot ${card.tint}`} />
                ))}
              </div>
            </div>
            <div className="front-grid" id="front-grid">
              {visibleCards.map((card, index) => (
                <div
                  key={card.key}
                  className={`front-glass-card ${card.tint} front-animate`}
                  style={{ "--delay": `${0.38 + index * 0.1}s` } as React.CSSProperties}
                  onClick={() => openGuideCard(card)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      openGuideCard(card);
                    }
                  }}
                >
                  <span className="front-glass-card-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="front-glass-card-icon">{card.icon}</span>
                  <h3 className="front-glass-card-title">{card.title}</h3>
                  <p className="front-glass-card-desc">{card.desc}</p>
                  <span className="front-glass-card-go" aria-hidden="true">→</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <nav className="front-pills front-animate" aria-label="快捷导航" style={{ "--delay": "0.72s" } as React.CSSProperties}>
          {visibleCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`front-pill ${card.tint}`}
              onClick={() => openGuideCard(card)}
            >
              {card.pillLabel}
            </button>
          ))}
        </nav>
      </div>
    </Layout>
  );
};

export default FrontPage;
