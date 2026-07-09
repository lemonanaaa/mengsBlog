import React from 'react';

interface Props {
  onScrollTop?: () => void;
}

export function BackToTopButton({ onScrollTop }: Props) {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onScrollTop?.();
  };

  return (
    <button
      type="button"
      className="back-to-top-button"
      data-visible="true"
      onClick={handleClick}
      aria-label="返回顶部"
    >
      ↑
    </button>
  );
}
