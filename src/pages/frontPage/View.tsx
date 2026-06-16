import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";
import "../../css/frontPage/frontPage.css";

const guideCards = [
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
    key: "photography",
    icon: "📸",
    title: "摄影师 Meng",
    pillLabel: "摄影",
    desc: "浏览拍摄作品、时间线记录与摄影相关内容",
    path: "/photography",
    tint: "tint-peach",
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

  const scrollToGrid = () => {
    document.getElementById("front-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="front-page">
        <div className="front-page-bg" aria-hidden="true" />

        <header className="front-topbar">
          <span className="front-logo">Meng</span>
          <div className="front-topbar-icons">
            <span className="front-topbar-icon" title="作品集入口">▦</span>
            <span className="front-topbar-icon" title="个人站点">✦</span>
          </div>
        </header>

        <div className="front-main">
          <section className="front-left">
            <span className="front-badge">前端工程师 · 上海</span>
            <h1 className="front-title">Meng</h1>
            <p className="front-tagline">Build things that work.</p>
            <p className="front-desc">
              你好，我是李萌。这个站点是我的前端作品集，
              集中展示工作经历、项目实践与能力结构，方便快速了解我的背景。
            </p>
            <div className="front-actions">
              <button
                type="button"
                className="front-btn front-btn-primary"
                onClick={() => navigateWithMeng("/career/resume")}
              >
                查看简历 ↗
              </button>
              <button
                type="button"
                className="front-btn front-btn-secondary"
                onClick={scrollToGrid}
              >
                作品集入口
              </button>
            </div>

            <div className="front-focus-strip">
              <div className="front-focus-strip-title">当前关注方向</div>
              <div className="front-focus-strip-items">
                {focusItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="front-right">
            <div className="front-grid-header">
              <span>作品集入口</span>
              <div className="front-grid-header-icon" aria-hidden="true">
                <i /><i /><i /><i />
              </div>
            </div>
            <div className="front-grid" id="front-grid">
              {guideCards.map((card) => (
                <div
                  key={card.key}
                  className={`front-glass-card ${card.tint}`}
                  onClick={() => navigateWithMeng(card.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigateWithMeng(card.path);
                    }
                  }}
                >
                  <span className="front-glass-card-icon">{card.icon}</span>
                  <h3 className="front-glass-card-title">{card.title}</h3>
                  <p className="front-glass-card-desc">{card.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <nav className="front-pills" aria-label="快捷导航">
          {guideCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`front-pill ${card.tint}`}
              onClick={() => navigateWithMeng(card.path)}
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
