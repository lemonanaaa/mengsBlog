import React, { useState } from 'react';
import { Drawer, Button } from 'antd';
import { MenuOutlined, UnorderedListOutlined } from '@ant-design/icons';

interface Props {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  hasToc: boolean;
}

export function ReaderLayout({ left, center, right, hasToc }: Props) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const hasLeft = !!left;
  const hasRight = !!right && hasToc;

  let variant = 'reader-layout--single';
  if (hasLeft && hasRight) variant = 'reader-layout--three';
  else if (hasRight) variant = 'reader-layout--center-right';
  else if (hasLeft) variant = 'reader-layout--left-center';

  const layoutClass = `reader-layout ${variant}`;

  return (
    <>
      {/* 移动端 drawer 触发按钮 */}
      <div className="reader-layout-mobile-triggers">
        {left && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setLeftOpen(true)}
            aria-label="打开导航"
            size="small"
          />
        )}
        {right && hasToc && (
          <Button
            type="text"
            icon={<UnorderedListOutlined />}
            onClick={() => setRightOpen(true)}
            aria-label="打开目录"
            size="small"
          />
        )}
      </div>

      <div className={layoutClass}>
        {/* 左栏 - 桌面端直接显示 */}
        {left && <aside className="reader-layout__left">{left}</aside>}

        {/* 中栏 */}
        <main className="reader-layout__center">{center}</main>

        {/* 右栏 - 桌面端直接显示 */}
        {right && hasToc && <aside className="reader-layout__right">{right}</aside>}
      </div>

      {/* 移动端 Drawer */}
      {left && (
        <Drawer
          title="导航"
          placement="left"
          open={leftOpen}
          onClose={() => setLeftOpen(false)}
          width={280}
        >
          {left}
        </Drawer>
      )}
      {right && hasToc && (
        <Drawer
          title="目录"
          placement="right"
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          width={300}
        >
          {right}
        </Drawer>
      )}
    </>
  );
}
