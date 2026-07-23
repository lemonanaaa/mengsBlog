import { API_CONFIG, apiRequest } from '../../config/api';

export interface VisitRecord {
  _id: string;
  path: string;
  search: string;
  referrer: string;
  browser: string;
  device: string;
  ipMasked: string;
  isPrivate: boolean;
  isMeng: boolean;
  createdAt: string;
}

export interface VisitListResponse {
  total: number;
  items: VisitRecord[];
}

export interface VisitDailyStat {
  date: string;
  count: number;
  privateCount: number;
}

export async function reportVisit(payload: {
  path: string;
  search?: string;
  referrer?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const url = `${API_CONFIG.PHOTO_BASE_URL}/visits`;
    // 静默上报，避免刷控制台；失败不影响浏览
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export async function fetchVisits(options: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  privateOnly?: boolean;
} = {}): Promise<VisitListResponse> {
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.privateOnly) params.set('privateOnly', 'true');
  const query = params.toString();
  const result = await apiRequest(`/visits${query ? `?${query}` : ''}`);
  return result.data || { total: 0, items: [] };
}

export async function fetchVisitDailyStats(
  from?: string,
  to?: string
): Promise<VisitDailyStat[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const result = await apiRequest(`/visits/stats/daily${query ? `?${query}` : ''}`);
  return result.data || [];
}
