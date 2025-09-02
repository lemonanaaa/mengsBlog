import React, { createContext, useState, useEffect } from "react";
import "../../css/common/layout.css";

import LeftMarks from "./leftMarks";
import LeftMarksForGuest from "./LeftMarksForGuest"
import { LeftMarksStorage } from "./leftMarks";

export const mengsBlogContext = createContext({});

const Layout = (props) => {
  const { children, leftType = 'normal' } = props;
  const [blogCommonStore, setBlogCommonStore] = useState({})
  
  // 使用 LeftMarksStorage 获取初始宽度
  const getInitialLeftWidth = () => {
    try {
      const state = LeftMarksStorage.getState();
      return state.width;
    } catch (error) {
      console.warn('Failed to get initial left width:', error);
      return 280; // 默认宽度
    }
  };

  const [leftWidth, setLeftWidth] = useState(getInitialLeftWidth);

  // 监听 leftMarks 宽度变化
  useEffect(() => {
    // 立即从 LeftMarksStorage 读取宽度
    const initialState = LeftMarksStorage.getState();
    setLeftWidth(initialState.width);

    const handleStorageChange = () => {
      const state = LeftMarksStorage.getState();
      setLeftWidth(state.width);
    };

    // 处理实时宽度变化事件
    const handleWidthChange = (e) => {
      if (e.detail && e.detail.width) {
        setLeftWidth(e.detail.width);
      } else {
        // 如果没有 detail，则从存储读取
        handleStorageChange();
      }
    };

    // 监听 localStorage 变化
    window.addEventListener('storage', handleStorageChange);
    
    // 监听自定义事件（当 leftMarks 宽度改变时触发）
    window.addEventListener('leftMarksWidthChange', handleWidthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('leftMarksWidthChange', handleWidthChange);
    };
  }, []);

  // 将状态和更新方法一起放入context value
  const contextValue = {
    blogCommonStore,
    setBlogCommonStore
  };

  return (
    <mengsBlogContext.Provider value={contextValue}>
      <div className="layout">
        <div 
          className="layout-left"
          style={{ width: leftWidth }}
        >
          {/* 默认显示 */}
          {leftType === 'normal' && <LeftMarks />}
          {/* 对摄影客人显示 */}
          {leftType === 'outer' && <LeftMarksForGuest />}
        </div>
        <div 
          className="layout-right"
          style={{ width: `calc(100% - ${leftWidth}px)` }}
        >
          {children}
        </div>

      </div>
    </mengsBlogContext.Provider>
  );
};

export default Layout;
