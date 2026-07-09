import { useState, useEffect, useRef, useCallback } from 'react';

export interface LastReadRecord {
  headingId: string | null;
  scrollPercent: number;
}

export function lastReadStorageKey(blogId: string): string {
  return `blog-last-read-${blogId}`;
}

export function isValidLastReadRecord(x: unknown): x is LastReadRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (r.headingId !== null && typeof r.headingId !== 'string') return false;
  if (typeof r.scrollPercent !== 'number') return false;
  if (!Number.isFinite(r.scrollPercent)) return false;
  if (r.scrollPercent < 0 || r.scrollPercent > 1) return false;
  return true;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * 管理单篇博客的上次阅读位置记录
 */
export function useLastReadPosition(blogId: string) {
  const key = lastReadStorageKey(blogId);

  const [record, setRecord] = useState<LastReadRecord | null>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (isValidLastReadRecord(parsed)) return parsed;
      window.localStorage.removeItem(key);
      return null;
    } catch {
      try { window.localStorage.removeItem(key); } catch {}
      return null;
    }
  });

  const saveRecord = useCallback((next: LastReadRecord) => {
    setRecord(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }, [key]);

  const clearRecord = useCallback(() => {
    setRecord(null);
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, [key]);

  return { record, saveRecord, clearRecord };
}

/**
 * 防抖记录滚动位置（500ms）
 */
export function useScrollRecorder(
  blogId: string,
  activeId: string | null,
  saveRecord: (r: LastReadRecord) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);

  // 缓存最新 activeId 避免 stale closure
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const onScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const doc = document.documentElement;
        const scrollMax = doc.scrollHeight - doc.clientHeight;
        const scrollPercent = scrollMax <= 0 ? 0 : clamp(window.scrollY / scrollMax, 0, 1);
        saveRecord({ headingId: activeIdRef.current, scrollPercent });
      }, 500);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [blogId, saveRecord]);
}

/**
 * 恢复上次阅读位置（仅执行一次）
 */
export function useRestoreScrollPosition(
  blogId: string,
  contentReady: boolean,
  record: LastReadRecord | null
) {
  const didRestore = useRef(false);

  useEffect(() => {
    if (!contentReady || didRestore.current) return;
    didRestore.current = true;

    if (!record) return;

    // 优先按 headingId 定位
    if (record.headingId) {
      const el = document.getElementById(record.headingId);
      if (el) {
        el.scrollIntoView();
        return;
      }
    }

    // 按 scrollPercent 回填
    const doc = document.documentElement;
    const scrollMax = doc.scrollHeight - doc.clientHeight;
    if (scrollMax > 0) {
      window.scrollTo(0, record.scrollPercent * scrollMax);
    }
  }, [contentReady, record, blogId]);
}
