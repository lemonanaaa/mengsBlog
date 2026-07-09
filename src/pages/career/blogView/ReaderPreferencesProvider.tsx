import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import {
  ReaderPreferences,
  DEFAULT_PREFERENCES,
  READER_PREFS_STORAGE_KEY,
  isValidPreferences,
} from './types';

interface ReaderPreferencesContextValue {
  preferences: ReaderPreferences;
  setPreferences: (next: ReaderPreferences) => void;
}

const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);

export function ReaderPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferencesState] = useState<ReaderPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const raw = window.localStorage.getItem(READER_PREFS_STORAGE_KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(raw);
      if (isValidPreferences(parsed)) return parsed;
      // 数据损坏 → 清除
      window.localStorage.removeItem(READER_PREFS_STORAGE_KEY);
      return DEFAULT_PREFERENCES;
    } catch {
      try { window.localStorage.removeItem(READER_PREFS_STORAGE_KEY); } catch {}
      return DEFAULT_PREFERENCES;
    }
  });

  const setPreferences = (next: ReaderPreferences) => {
    setPreferencesState(next);
    try {
      window.localStorage.setItem(READER_PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 配额满或私有模式 → 降级为内存态
    }
  };

  return (
    <ReaderPreferencesContext.Provider value={{ preferences, setPreferences }}>
      <div
        className="reader-root"
        data-theme="light"
        data-font-size={preferences.fontSize}
      >
        {children}
      </div>
    </ReaderPreferencesContext.Provider>
  );
}

export function useReaderPreferences(): ReaderPreferencesContextValue {
  const ctx = useContext(ReaderPreferencesContext);
  if (!ctx) {
    throw new Error('useReaderPreferences must be used within ReaderPreferencesProvider');
  }
  return ctx;
}
