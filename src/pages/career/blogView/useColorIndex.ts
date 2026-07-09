import { useState, useEffect, useRef, useCallback } from 'react';

export type ColorKind = 'text' | 'bg';

export interface ColorInfo {
  key: string; // 唯一键：`${kind}:${color}`
  kind: ColorKind; // 文字颜色 or 背景颜色
  color: string; // 归一化后的 CSS 颜色值
  count: number;
}

/** 归一化颜色字符串：去空格 + 小写，便于分组（rgb(231, 95, 51) → rgb(231,95,51)） */
function normalizeColor(c: string): string {
  return c.replace(/\s+/g, '').toLowerCase();
}

/**
 * 扫描正文中所有带颜色内联样式的元素，按「类型 + 颜色」分组（保持文档顺序）
 * - 文字颜色 (style.color) 与 背景色 (style.backgroundColor) 分别独立成组
 */
function scanColors(root: HTMLElement): {
  order: string[];
  map: Map<string, HTMLElement[]>;
  infoByKey: Map<string, { kind: ColorKind; color: string }>;
} {
  const map = new Map<string, HTMLElement[]>();
  const order: string[] = [];
  const infoByKey = new Map<string, { kind: ColorKind; color: string }>();

  const nodes = root.querySelectorAll<HTMLElement>('[style*="color"]');
  nodes.forEach((el) => {
    const add = (kind: ColorKind, raw: string) => {
      if (!raw) return;
      const color = normalizeColor(raw);
      const key = `${kind}:${color}`;
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
        infoByKey.set(key, { kind, color });
      }
      map.get(key)!.push(el);
    };
    add('text', el.style.color);
    add('bg', el.style.backgroundColor);
  });

  return { order, map, infoByKey };
}

/**
 * 颜色重点索引：扫描正文颜色片段（文字色 + 背景色，分开），
 * 提供按「颜色项」的上一个/下一个跳转
 */
export function useColorIndex(
  bodyRef: React.RefObject<HTMLElement>,
  contentKey: string
) {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [position, setPosition] = useState(0); // 0-based，当前定位到该颜色项的第几处
  const mapRef = useRef<Map<string, HTMLElement[]>>(new Map());

  // content 变化时重新扫描
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) {
      setColors([]);
      mapRef.current = new Map();
      setActiveKey(null);
      setPosition(0);
      return;
    }
    const { order, map, infoByKey } = scanColors(el);
    mapRef.current = map;
    const infos: ColorInfo[] = order.map((key) => {
      const info = infoByKey.get(key)!;
      return { key, kind: info.kind, color: info.color, count: map.get(key)!.length };
    });
    setColors(infos);
    setActiveKey(infos.length ? infos[0].key : null);
    setPosition(0);
  }, [bodyRef, contentKey]);

  const jump = useCallback((key: string, idx: number) => {
    const list = mapRef.current.get(key);
    if (!list || list.length === 0) return;
    const n = ((idx % list.length) + list.length) % list.length; // 环绕
    const target = list[n];
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 背景色片段本身有底色 → 用描边闪烁；文字色片段 → 用背景闪烁
    const kind = key.slice(0, key.indexOf(':'));
    const flashClass =
      kind === 'bg' ? 'color-index-flash-outline' : 'color-index-flash';
    const flashDuration = kind === 'bg' ? 2000 : 1200;
    target.classList.remove('color-index-flash', 'color-index-flash-outline');
    target.getBoundingClientRect(); // 强制回流以重启动画
    target.classList.add(flashClass);
    window.setTimeout(() => target.classList.remove(flashClass), flashDuration);
    setPosition(n);
  }, []);

  const selectColor = useCallback(
    (key: string) => {
      setActiveKey(key);
      setPosition(0);
      jump(key, 0);
    },
    [jump]
  );

  const next = useCallback(() => {
    if (activeKey) jump(activeKey, position + 1);
  }, [activeKey, position, jump]);

  const prev = useCallback(() => {
    if (activeKey) jump(activeKey, position - 1);
  }, [activeKey, position, jump]);

  const total = activeKey ? mapRef.current.get(activeKey)?.length ?? 0 : 0;

  return { colors, activeKey, selectColor, position, total, next, prev };
}
