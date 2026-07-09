import React from 'react';
import { ColorInfo } from './useColorIndex';

interface Props {
  colors: ColorInfo[];
  activeKey: string | null;
  selectColor: (key: string) => void;
  position: number; // 0-based
  total: number;
  next: () => void;
  prev: () => void;
}

export function ColorIndexPanel({
  colors,
  activeKey,
  selectColor,
  position,
  total,
  next,
  prev,
}: Props) {
  if (colors.length === 0) return null;

  const textColors = colors.filter((c) => c.kind === 'text');
  const bgColors = colors.filter((c) => c.kind === 'bg');

  const renderSwatch = (c: ColorInfo) => {
    const isActive = activeKey === c.key;
    const isText = c.kind === 'text';
    return (
      <button
        key={c.key}
        type="button"
        className={
          `color-index-swatch${isText ? ' color-index-swatch--text' : ''}` +
          `${isActive ? ' is-active' : ''}`
        }
        style={isText ? { color: c.color } : { backgroundColor: c.color }}
        onClick={() => selectColor(c.key)}
        aria-label={`${isText ? '文字颜色' : '背景颜色'} ${c.color}，共 ${c.count} 处`}
        title={`${c.count} 处`}
      >
        {isText ? 'A' : ''}
      </button>
    );
  };

  return (
    <div className="color-index-panel">
      <div className="color-index-title">重点索引</div>

      {textColors.length > 0 && (
        <div className="color-index-group">
          <span className="color-index-group-label">文字</span>
          <div className="color-index-swatches">{textColors.map(renderSwatch)}</div>
        </div>
      )}

      {bgColors.length > 0 && (
        <div className="color-index-group">
          <span className="color-index-group-label">背景</span>
          <div className="color-index-swatches">{bgColors.map(renderSwatch)}</div>
        </div>
      )}

      {activeKey && total > 0 && (
        <div className="color-index-nav">
          <button
            type="button"
            className="color-index-btn"
            onClick={prev}
            aria-label="上一个"
          >
            ←
          </button>
          <span className="color-index-counter">
            {position + 1} / {total}
          </span>
          <button
            type="button"
            className="color-index-btn"
            onClick={next}
            aria-label="下一个"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
