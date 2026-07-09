import React from 'react';
import { useReadingProgress } from './useReadingProgress';

export function ReadingProgressBar() {
  const progress = useReadingProgress();

  return (
    <div className="reading-progress-bar">
      <div
        className="reading-progress-bar__fill"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
