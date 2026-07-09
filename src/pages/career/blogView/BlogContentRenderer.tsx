import React, { useEffect } from 'react';
import { message } from 'antd';
import {
  injectHeadingIds,
  injectHeadingAnchors,
  injectSectionToggles,
  applyCollapseState,
  toggleHeadingCollapse,
  highlightPreCodeElements,
} from './postRender';
import { copyToClipboard } from './clipboard';

interface Props {
  content: string;
  bodyRef: React.RefObject<HTMLDivElement>;
  onContentReady?: () => void;
}

export function BlogContentRenderer({ content, bodyRef, onContentReady }: Props) {
  // DOM 后处理 pass
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    injectHeadingIds(el);
    injectHeadingAnchors(el);
    injectSectionToggles(el);
    applyCollapseState(el);
    highlightPreCodeElements(el);
    onContentReady?.();
  }, [content, bodyRef, onContentReady]);

  // 事件委托：锚点复制 + 标题折叠
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1) 锚点复制按钮
      const anchor = target.closest('.heading-anchor') as HTMLElement | null;
      if (anchor && el.contains(anchor)) {
        const anchorId = anchor.getAttribute('data-anchor');
        if (!anchorId) return;
        const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
        try {
          await copyToClipboard(url);
          message.success('链接已复制');
        } catch {
          message.error('复制失败');
        }
        return;
      }

      // 2) 可折叠标题（点击标题本身折叠/展开该节内容）
      const heading = target.closest('.collapsible-heading') as HTMLElement | null;
      if (heading && el.contains(heading)) {
        toggleHeadingCollapse(el, heading);
      }
    };

    el.addEventListener('click', handleClick as EventListener);
    return () => {
      el.removeEventListener('click', handleClick as EventListener);
    };
  }, [bodyRef]);

  return (
    <article
      ref={bodyRef}
      className="blog-article"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
