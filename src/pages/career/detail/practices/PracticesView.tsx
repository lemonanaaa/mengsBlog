import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FOUNDATION_CATEGORY,
  CATEGORIES,
  PracticeCategory,
  CategoryMeta,
  getPublishedPractices,
  isCategoryLit,
} from "./practicesData";
import "../../../../css/career/practices.css";

const PracticesView: React.FC = () => {
  const allCategories = useMemo<CategoryMeta[]>(
    () => [FOUNDATION_CATEGORY, ...CATEGORIES],
    []
  );

  // 默认选中第一个有内容的分类
  const firstLit = useMemo<PracticeCategory>(
    () => allCategories.find((c) => isCategoryLit(c.key))?.key ?? "mcp",
    [allCategories]
  );

  const [activeCategory, setActiveCategory] = useState<PracticeCategory>(firstLit);
  const [openId, setOpenId] = useState<string | null>(null);

  const activePractices = getPublishedPractices(activeCategory);

  // 切换分类时：只有一条就自动展开，多条则收起
  useEffect(() => {
    const list = getPublishedPractices(activeCategory);
    setOpenId(list.length === 1 ? list[0].id : null);
  }, [activeCategory]);

  const renderNode = (category: CategoryMeta) => {
    const lit = isCategoryLit(category.key);
    const active = activeCategory === category.key;
    const isFoundation = category.key === "foundation";
    const count = getPublishedPractices(category.key).length;

    const classNames = [
      "practice-node",
      isFoundation ? "practice-node--foundation" : "",
      lit ? "is-lit" : "is-dim",
      active ? "is-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

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
          <span className="practice-node-count">{count} 篇实践</span>
        ) : (
          <span className="practice-node-soon">敬请期待</span>
        )}
      </button>
    );
  };

  return (
    <div className="practices">
      <div className="practices-head">
        <h3>AI 工程实践</h3>
        <p>
          前端 + Agent：日常研发里我怎么用、驾驭、沉淀 AI Agent 的能力。点亮的分类可以点开细看，其余会陆续补充。
        </p>
      </div>

      <div className="practices-map">
        {renderNode(FOUNDATION_CATEGORY)}
        <div className="practices-grid">
          {CATEGORIES.map((category) => (
            <React.Fragment key={category.key}>{renderNode(category)}</React.Fragment>
          ))}
        </div>
      </div>

      <div className="practices-panel">
        {activePractices.length === 0 ? (
          <div className="practices-empty">这类实践还在整理中，敬请期待。</div>
        ) : (
          activePractices.map((practice) => {
            const open = openId === practice.id;
            return (
              <div
                key={practice.id}
                className={`practice-item${open ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="practice-item-head"
                  onClick={() => setOpenId(open ? null : practice.id)}
                  aria-expanded={open}
                >
                  <span className="practice-item-icon" aria-hidden="true">
                    {practice.icon}
                  </span>
                  <span className="practice-item-titles">
                    <span className="practice-item-title">{practice.title}</span>
                    <span className="practice-item-summary">{practice.summary}</span>
                  </span>
                  <span className="practice-item-chevron" aria-hidden="true">
                    {open ? "▾" : "▸"}
                  </span>
                </button>
                {open && (
                  <div className="practice-item-body">
                    <ReactMarkdown>{practice.content ?? ""}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PracticesView;
