export type FontSize = 'sm' | 'md' | 'lg';
export type Theme = 'light' | 'dark';

export interface ReaderPreferences {
  fontSize: FontSize;
  theme: Theme;
}

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  fontSize: 'md',
  theme: 'light',
};

export const READER_PREFS_STORAGE_KEY = 'blog-reader-preferences';

export function isValidPreferences(x: unknown): x is ReaderPreferences {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    (p.fontSize === 'sm' || p.fontSize === 'md' || p.fontSize === 'lg') &&
    (p.theme === 'light' || p.theme === 'dark')
  );
}
