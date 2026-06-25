import { apiRequest } from '../../config/api';

export interface JournalEntry {
  _id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalDailyStat {
  date: string;
  count: number;
}

export interface JournalSearchResult {
  _id: string;
  date: string;
  createdAt: string;
  snippet: string;
  content: string;
}

export interface JournalSearchResponse {
  total: number;
  items: JournalSearchResult[];
}

export async function fetchJournalDailyStats(
  from?: string,
  to?: string
): Promise<JournalDailyStat[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const result = await apiRequest(`/journal/stats/daily${query ? `?${query}` : ''}`);
  return result.data || [];
}

export async function fetchJournalEntries(date: string): Promise<JournalEntry[]> {
  const result = await apiRequest(`/journal/entries?date=${encodeURIComponent(date)}`);
  return result.data || [];
}

export async function createJournalEntry(
  date: string,
  content: string
): Promise<JournalEntry> {
  const result = await apiRequest('/journal/entries', {
    method: 'POST',
    body: JSON.stringify({ date, content }),
  });
  return result.data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await apiRequest(`/journal/entries/${id}`, { method: 'DELETE' });
}

export async function searchJournalEntries(
  q: string,
  options: { from?: string; to?: string; limit?: number; offset?: number } = {}
): Promise<JournalSearchResponse> {
  const params = new URLSearchParams({ q });
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  const result = await apiRequest(`/journal/search?${params.toString()}`);
  return result.data || { total: 0, items: [] };
}
