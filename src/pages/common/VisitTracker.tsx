import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { reportVisit } from '../visits/api';

const DEDUPE_MS = 2500;
const STORAGE_KEY = 'mengsblog_last_visit_report';

/**
 * 全站页面访问上报（挂在 Layout 内，覆盖所有带侧栏的页面）
 */
const VisitTracker = () => {
  const location = useLocation();
  const reportingRef = useRef(false);

  useEffect(() => {
    const path = location.pathname || '/';
    // 查看访客页本身也记，但避免刷屏时可识别
    const search = location.search || '';
    const fullKey = `${path}${search}`;

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prev = JSON.parse(raw) as { key?: string; at?: number };
        if (prev.key === fullKey && typeof prev.at === 'number' && Date.now() - prev.at < DEDUPE_MS) {
          return;
        }
      }
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ key: fullKey, at: Date.now() })
      );
    } catch {
      // sessionStorage 不可用时仍上报
    }

    if (reportingRef.current) return;
    reportingRef.current = true;

    reportVisit({
      path,
      search,
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
    }).finally(() => {
      reportingRef.current = false;
    });
  }, [location.pathname, location.search]);

  return null;
};

export default VisitTracker;
