import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { createNavigateWithMeng } from "../../../utils/navigation";
import { matchJd, MatchResult } from "./api";
import "../../../css/career/match.css";

const SAMPLE_JD = `高级前端工程师 · 上海

要求：
- React 3 年+、TypeScript
- 复杂 C 端业务与性能优化经验
- 工程化：Webpack、CI/CD、质量门禁

加分：AI 应用落地、B 端系统、Monorepo`;

const PREVIEW_DIMENSIONS = [
  { name: "技术栈", note: "各维度 0–100 分，附一句依据说明" },
  { name: "业务场景", note: "对照 JD 与简历中的业务经历" },
  { name: "工程化", note: "工具链、质量保障等落地情况" },
  { name: "加分项", note: "AI 应用等非核心要求" },
];

const MatchPreviewLayout = () => (
  <>
    <div className="match-result-header">
      <h2>报告样式预览</h2>
      <div className="match-overall">
        <span className="match-overall-label">综合匹配</span>
        <span className="match-overall-score match-overall-score--placeholder">—</span>
      </div>
    </div>

    <p className="match-summary match-text--placeholder">
      AI 将在此输出 2–3 句综合判断，概括整体匹配程度与核心依据。
    </p>

    <ul className="match-dimensions">
      {PREVIEW_DIMENSIONS.map((dim) => (
        <li key={dim.name} className="match-dimension">
          <div className="match-dimension-top">
            <span className="match-dimension-name">{dim.name}</span>
            <span className="match-dimension-score match-dimension-score--placeholder">—</span>
          </div>
          <div className="match-dimension-bar">
            <span className="match-dimension-fill match-dimension-fill--placeholder" />
          </div>
          <span className="match-dimension-note match-text--placeholder">{dim.note}</span>
        </li>
      ))}
    </ul>

    <div className="match-highlights">
      <h3>匹配亮点</h3>
      <ul className="match-text--placeholder">
        <li>与 JD 要求高度吻合的经历要点</li>
        <li>可量化的项目成果或工程化实践</li>
      </ul>
    </div>

    <div className="match-gaps">
      <h3>差距 / 待确认</h3>
      <ul className="match-text--placeholder">
        <li>JD 要求但简历未充分体现的部分</li>
        <li>需面试进一步确认的技能或方向</li>
      </ul>
    </div>
  </>
);

type MatchStatus = "idle" | "loading" | "success" | "error";

type MatchResultViewProps = {
  result: MatchResult;
};

const MatchResultView = ({ result }: MatchResultViewProps) => (
  <>
    <div className="match-result-header">
      <h2>匹配结果</h2>
      <div className="match-overall">
        <span className="match-overall-label">综合匹配</span>
        <span className="match-overall-score">{result.overall}</span>
      </div>
    </div>

    <p className="match-result-live-note">由 AI 根据当前 JD 实时生成</p>

    <p className="match-summary">{result.summary}</p>

    <ul className="match-dimensions">
      {result.dimensions.map((dim) => (
        <li key={dim.name} className="match-dimension">
          <div className="match-dimension-top">
            <span className="match-dimension-name">{dim.name}</span>
            <span className="match-dimension-score">{dim.score ?? "—"}</span>
          </div>
          {dim.score != null && (
            <div className="match-dimension-bar">
              <span
                className="match-dimension-fill"
                style={{ width: `${dim.score}%` }}
              />
            </div>
          )}
          <span className="match-dimension-note">{dim.note}</span>
        </li>
      ))}
    </ul>

    {result.highlights.length > 0 && (
      <div className="match-highlights">
        <h3>匹配亮点</h3>
        <ul>
          {result.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    )}

    {result.gaps.length > 0 && (
      <div className="match-gaps">
        <h3>差距 / 待确认</h3>
        <ul>
          {result.gaps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    )}
  </>
);

const CareerMatchView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const runMatch = async (jdText: string) => {
    const trimmed = jdText.trim();
    if (trimmed.length < 30) {
      setError("请至少输入 30 字的岗位描述");
      setStatus("error");
      return;
    }

    setHasAttempted(true);
    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const data = await matchJd(trimmed);
      setResult(data);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "匹配失败，请检查网络或稍后重试";
      setError(message);
      setStatus("error");
    }
  };

  const handleSubmit = () => runMatch(jd);

  const handleTrySample = () => {
    setJd(SAMPLE_JD);
    runMatch(SAMPLE_JD);
  };

  const canSubmit = jd.trim().length >= 30 && status !== "loading";
  const showPreview = !hasAttempted || (status === "error" && !result);

  return (
    <Layout>
      <div className="match-page">
        <header className="match-hero">
          <span className="match-hero-badge">AI简历匹配器</span>
          <h1>粘贴 JD，对照我的经历智能匹配</h1>
          <p className="match-hero-desc">
            粘贴岗位描述，AI 对照简历输出匹配度、亮点与差距分析。
          </p>
        </header>

        <div className="match-layout">
          <section className="match-panel match-panel-input">
            <h2>输入岗位描述</h2>
            <p className="match-panel-hint">粘贴招聘网站的 JD 文字即可，建议 50 字以上。</p>
            <textarea
              className="match-jd-input"
              rows={10}
              placeholder={SAMPLE_JD}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              disabled={status === "loading"}
            />
            <div className="match-input-meta">
              <span className={jd.trim().length >= 30 ? "match-char-ok" : ""}>
                {jd.trim().length} 字
                {jd.trim().length < 30 ? "（至少 30 字）" : ""}
              </span>
            </div>
            <div className="match-input-actions">
              <button
                type="button"
                className={`match-submit-btn${canSubmit ? " match-submit-btn--active" : ""}`}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {status === "loading" ? (
                  <>
                    <span className="match-spinner" aria-hidden="true" />
                    分析中…
                  </>
                ) : (
                  <>
                    <span className="match-submit-icon">✨</span>
                    开始匹配
                  </>
                )}
              </button>
              <button
                type="button"
                className="match-sample-btn match-sample-btn--filled"
                disabled={status === "loading"}
                onClick={handleTrySample}
              >
                用示例 JD 试一次
              </button>
            </div>
            {status === "error" && error && (
              <p className="match-error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="match-panel match-panel-result">
            {status === "loading" && (
              <div className="match-empty match-empty--loading">
                <span className="match-spinner match-spinner--lg" aria-hidden="true" />
                <p>正在对照简历分析匹配度…</p>
                <p className="match-empty-hint">通常需要 10–30 秒</p>
              </div>
            )}

            {status === "success" && result && <MatchResultView result={result} />}

            {showPreview && status !== "loading" && status !== "success" && (
              <>
                {!hasAttempted && (
                  <div className="match-start-cta">
                    <p className="match-start-cta-title">你的匹配结果将显示在这里</p>
                    <p className="match-start-cta-desc">
                      粘贴 JD 后点击「开始匹配」，或点「用示例 JD 试一次」快速体验
                    </p>
                  </div>
                )}

                {hasAttempted && status === "error" && (
                  <div className="match-retry-hint">
                    <span aria-hidden="true">⚠️</span>
                    <span>匹配未完成，请修改 JD 后重试</span>
                  </div>
                )}

                <div className="match-preview-wrap">
                  <p className="match-preview-label">以下为报告结构示意，分数与文案均为占位</p>
                  <MatchPreviewLayout />
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="match-footer">
          <button
            type="button"
            className="match-footer-link"
            onClick={() => navigateWithMeng("/career/resume")}
          >
            查看完整简历 →
          </button>
          <button
            type="button"
            className="match-footer-link match-footer-link-muted"
            onClick={() => navigateWithMeng("/career/detail")}
          >
            工作介绍与工程实践 →
          </button>
        </footer>
      </div>
    </Layout>
  );
};

export default CareerMatchView;
