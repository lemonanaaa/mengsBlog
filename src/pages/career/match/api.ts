import { API_CONFIG } from '../../../config/api';

export type MatchDimension = {
  name: string;
  score: number | null;
  note: string;
  evidence?: string[];
};

export type MatchResult = {
  overall: number;
  dimensions: MatchDimension[];
  highlights: string[];
  gaps: string[];
  summary: string;
};

type MatchApiResponse = {
  success?: boolean;
  data?: MatchResult;
  message?: string;
};

export async function matchJd(jd: string): Promise<MatchResult> {
  const url = `${API_CONFIG.PHOTO_BASE_URL}/match`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd: jd.trim() }),
  });

  let payload: MatchApiResponse;
  try {
    payload = await response.json();
  } catch {
    throw new Error('匹配失败，请稍后重试');
  }

  if (!response.ok || !payload?.success || !payload?.data) {
    throw new Error(payload?.message || '匹配失败，请稍后重试');
  }

  return payload.data;
}
