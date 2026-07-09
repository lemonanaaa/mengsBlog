import React from 'react';
import { useScrollRecorder, useRestoreScrollPosition, LastReadRecord } from './useLastReadPosition';

interface Props {
  blogId: string;
  contentReady: boolean;
  activeId: string | null;
  record: LastReadRecord | null;
  saveRecord: (r: LastReadRecord) => void;
}

/**
 * Headless 组件：记录 + 恢复阅读位置
 */
export function LastReadTracker({ blogId, contentReady, activeId, record, saveRecord }: Props) {
  useScrollRecorder(blogId, activeId, saveRecord);
  useRestoreScrollPosition(blogId, contentReady, record);
  return null;
}
