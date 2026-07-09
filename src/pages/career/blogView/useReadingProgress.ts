import { useState, useEffect } from 'react';

/**
 * 计算阅读进度：clamp(scrollTop / scrollMax, 0, 1)
 * 处理边界：非有限值 → 0；scrollMax <= 0 → 0
 */
export function computeProgress(scrollTop: number, scrollMax: number): number {
  if (!Number.isFinite(scrollTop) || !Number.isFinite(scrollMax)) return 0;
  if (scrollMax <= 0) return 0;
  const raw = scrollTop / scrollMax;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}

/**
 * 阅读进度 hook：监听 window scroll/resize，返回 0~1 进度值
 */
export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollMax = doc.scrollHeight - doc.clientHeight;
      setProgress(computeProgress(scrollTop, scrollMax));
    };
    onScroll(); // 首次立即计算
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progress;
}
