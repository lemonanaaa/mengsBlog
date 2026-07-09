import React from 'react';
import { Button, Space } from 'antd';
import { useReaderPreferences } from './ReaderPreferencesProvider';
import { FontSize } from './types';

const FONT_SIZES: { key: FontSize; label: string }[] = [
  { key: 'sm', label: '小' },
  { key: 'md', label: '中' },
  { key: 'lg', label: '大' },
];

export function ReaderToolbar() {
  const { preferences, setPreferences } = useReaderPreferences();

  const handleFontSize = (fs: FontSize) => {
    setPreferences({ ...preferences, fontSize: fs });
  };

  return (
    <div className="reader-toolbar">
      <Space size="small">
        {/* 字号三档 */}
        {FONT_SIZES.map((fs) => (
          <Button
            key={fs.key}
            type={preferences.fontSize === fs.key ? 'primary' : 'default'}
            size="small"
            onClick={() => handleFontSize(fs.key)}
            aria-label={`字号${fs.label}`}
          >
            {fs.label}
          </Button>
        ))}
      </Space>
    </div>
  );
}
