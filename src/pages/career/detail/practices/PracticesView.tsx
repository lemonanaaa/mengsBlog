import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  CATEGORIES,
  PracticeCategory,
  CategoryMeta,
  getPublishedPractices,
  isCategoryLit,
} from "./practicesData";
import "../../../../css/career/practices.css";

interface PracticeDiagram {
  id: string;
  title: string;
  hint: string;
  src: string;
  alt: string;
}

const PRACTICE_DIAGRAMS: PracticeDiagram[] = [
  {
    id: "architecture",
    title: "Claude Code 能力分层",
    hint: "MCP / Skill / 工作流在整体架构中的位置",
    src: "/images/career/practices/claude-code-architecture.png",
    alt: "Claude Code 能力分层：Agent、Tools、MCP、Skills、Hooks、Context 等模块关系",
  },
  {
    id: "mcp-vs-skill",
    title: "MCP vs Skill 对比",
    hint: "接平台用 MCP，固化流程用 Skill",
    src: "/images/career/practices/mcp-vs-skill.png",
    alt: "MCP 与 Skill 在 Claude Code 中的对比：本质、组成、预加载、调用方式与配置位置",
  },
];

const getDefaultOpenIds = (category: PracticeCategory): Set<string> => {
  if (category === "workflow") {
    return new Set();
  }
  return new Set(getPublishedPractices(category).map((practice) => practice.id));
};

const PracticesView: React.FC = () => {
  const firstLit = useMemo<PracticeCategory>(
    () => CATEGORIES.find((c) => isCategoryLit(c.key))?.key ?? "foundation",
    []
  );

  const [activeCategory, setActiveCategory] = useState<PracticeCategory>(firstLit);
  const [openIds, setOpenIds] = useState<Set<string>>(() => getDefaultOpenIds(firstLit));
  const [lightbox, setLightbox] = useState<PracticeDiagram | null>(null);

  const activePractices = getPublishedPractices(activeCategory);
  const isFoundation = activeCategory === "foundation";

  useEffect(() => {
    setOpenIds(getDefaultOpenIds(activeCategory));
  }, [activeCategory]);

  const togglePractice = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightbox]);

  const renderNode = (category: CategoryMeta) => {
    const lit = isCategoryLit(category.key);
    const active = activeCategory === category.key;
    const count = getPublishedPractices(category.key).length;

    const classNames = [
      "practice-node",
      lit ? "is-lit" : "is-dim",
      active ? "is-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const badge =
      category.key === "foundation"
        ? `${PRACTICE_DIAGRAMS.length} 张全景图`
        : `${count} 篇实践`;

    return (
      <button
        type="button"
        className={classNames}
        onClick={lit ? () => setActiveCategory(category.key) : undefined}
        disabled={!lit}
        aria-pressed={active}
      >
        <span className="practice-node-icon" aria-hidden="true">
          {category.icon}
        </span>
        <span className="practice-node-label">{category.label}</span>
        <span className="practice-node-hint">{category.hint}</span>
        {lit ? (
          <span className="practice-node-count">{badge}</span>
        ) : (
          <span className="practice-node-soon">敬请期待</span>
        )}
      </button>
    );
  };

  const renderFoundationPanel = () => (
    <div className="practice-foundation">
      <p className="practice-foundation-lead">
        读 MCP、Skill、工作流三类实践前，先弄清 Claude Code 的能力分层，以及 MCP 与 Skill 的分工。
      </p>
      <div className="practice-foundation-grid">
        {PRACTICE_DIAGRAMS.map((diagram) => (
          <button
            key={diagram.id}
            type="button"
            className="practice-foundation-item"
            onClick={() => setLightbox(diagram)}
          >
            <div className="practice-foundation-meta">
              <strong>{diagram.title}</strong>
              <span>{diagram.hint}</span>
            </div>
            <div className="practice-foundation-preview">
              <img src={diagram.src} alt={diagram.alt} loading="lazy" />
            </div>
            <span className="practice-foundation-action">点击放大查看</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPracticeContent = (practice: (typeof activePractices)[number]) => (
    <ReactMarkdown>{practice.content ?? ""}</ReactMarkdown>
  );

  const renderPracticeItem = (practice: (typeof activePractices)[number]) => {
    const open = openIds.has(practice.id);

    return (
      <div
        key={practice.id}
        className={`practice-item practice-item--collapsible${open ? " is-open" : ""}`}
      >
        <div className="practice-item-head">
          <button
            type="button"
            className="practice-item-toggle"
            onClick={() => togglePractice(practice.id)}
            aria-expanded={open}
          >
            <span className="practice-item-icon" aria-hidden="true">
              {practice.icon}
            </span>
            <span className="practice-item-titles">
              <span className="practice-item-title">{practice.title}</span>
              <span className="practice-item-summary">{practice.summary}</span>
            </span>
          </button>
          <div className="practice-item-head-actions">
            {practice.link && (
              <a
                className="practice-item-link"
                href={practice.link.href}
                target="_blank"
                rel="noreferrer"
              >
                {practice.link.label}
              </a>
            )}
            <button
              type="button"
              className="practice-item-chevron-button"
              onClick={() => togglePractice(practice.id)}
              aria-expanded={open}
              aria-label={open ? `收起${practice.title}` : `展开${practice.title}`}
            >
              <span className="practice-item-chevron" aria-hidden="true">
                {open ? "▾" : "▸"}
              </span>
            </button>
          </div>
        </div>
        {open && (
          <div className="practice-item-body practice-content">
            {renderPracticeContent(practice)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="practices">
      <div className="practices-head">
        <h3>AI 工程实践</h3>
        <p>
          前端 + Agent：通过 MCP 连接工具、用 Skill 沉淀经验，再以工作流稳定交付。
        </p>
      </div>

      <div className="practices-map">
        <div className="practices-grid">
          {CATEGORIES.map((category) => (
            <React.Fragment key={category.key}>{renderNode(category)}</React.Fragment>
          ))}
        </div>
      </div>

      <div className="practices-panel">
        {isFoundation ? (
          renderFoundationPanel()
        ) : activePractices.length === 0 ? (
          <div className="practices-empty">这类实践还在整理中，敬请期待。</div>
        ) : (
          activePractices.map((practice) => renderPracticeItem(practice))
        )}
      </div>

      {lightbox && (
        <div
          className="practices-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="practices-lightbox-close"
            aria-label="关闭"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <div
            className="practices-lightbox-body"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={lightbox.src} alt={lightbox.alt} />
            <p>{lightbox.hint}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticesView;
