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
    title: "简历页面",
    pillLabel: "简历",
    desc: "完整工作经历、项目背景与成果指标，适合投递或面试前快速了解",
    path: "/career/resume",
    tint: "tint-purple",
  },
  {
    key: "detail",
    icon: "🧭",
    title: "前端详情页",
    pillLabel: "项目详情",
    desc: "技能栈、工作经历、项目实践与技术内容的完整展示",
    path: "/career/detail",
    tint: "tint-pink",
  },
  {
    key: "tree",
    icon: "🌳",
    title: "前端知识树",
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

const focusItems = [
  "复杂业务场景下的前端架构与可维护性",
  "跨端复用与工程链路优化",
  "性能优化、监控建设与研发提效",
];

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
          <div className="front-topbar-icons">
            <span className="front-topbar-icon" title="作品集入口">▦</span>
            <span className="front-topbar-icon" title="个人站点">✦</span>
          </div>
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
              你好，我是李萌。这个站点是我的前端作品集，
              集中展示工作经历、项目实践与能力结构，方便快速了解我的背景。
            </p>
            <div className="front-actions front-animate" style={{ "--delay": "0.44s" } as React.CSSProperties}>
              <button
                type="button"
                className="front-btn front-btn-primary"
                onClick={() => navigateWithMeng("/career/resume")}
              >
                <span>查看简历</span>
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

            <div className="front-focus-strip front-animate" style={{ "--delay": "0.52s" } as React.CSSProperties}>
              <div className="front-focus-strip-title">当前关注方向</div>
              <div className="front-focus-strip-items">
                {focusItems.map((item, index) => (
                  <span
                    key={item}
                    className="front-focus-item"
                    style={{ "--delay": `${0.58 + index * 0.08}s` } as React.CSSProperties}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="front-right">
            <div className="front-grid-header front-animate" style={{ "--delay": "0.3s" } as React.CSSProperties}>
              <span>作品集入口</span>
              <div className="front-grid-header-icon" aria-hidden="true">
                <i /><i /><i /><i />
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
