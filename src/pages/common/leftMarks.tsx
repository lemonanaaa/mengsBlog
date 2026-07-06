import React, { useState, useContext, useRef, useEffect } from "react";
import { Image } from 'antd';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { mengsBlogContext } from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";

// 侧边栏配置接口
interface LeftMarksConfig {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
}

// 侧边栏状态接口
interface LeftMarksState {
  width: number;
  isCollapsed: boolean;
  previousWidth: number; // 收起前的宽度，用于恢复
}

// localStorage 存储管理类
export class LeftMarksStorage {
  private static readonly STORAGE_KEY = 'leftMarksState';
  
  // 获取存储的状态
  static getState(): LeftMarksState {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Failed to parse leftMarks state from localStorage:', error);
    }
    
    // 返回默认状态
    return {
      width: 240,
      isCollapsed: true,
      previousWidth: 240
    };
  }
  
  // 保存状态
  static saveState(state: Partial<LeftMarksState>): void {
    try {
      const currentState = this.getState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save leftMarks state to localStorage:', error);
    }
  }
  
  // 获取收起前的宽度
  static getPreviousWidth(): number {
    try {
      const state = this.getState();
      return state.previousWidth;
    } catch (error) {
      console.warn('Failed to get previous width from state:', error);
      return 240;
    }
  }
  
  // 保存收起前的宽度
  static savePreviousWidth(width: number): void {
    try {
      const currentState = this.getState();
      this.saveState({ ...currentState, previousWidth: width });
    } catch (error) {
      console.warn('Failed to save previous width to state:', error);
    }
  }
  
  // 清除所有存储的数据
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear leftMarks storage:', error);
    }
  }
}

const LeftMarks = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blogCommonStore, setBlogCommonStore } = useContext(mengsBlogContext) as any;
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);
  
  // 侧边栏配置
  const config: LeftMarksConfig = {
    defaultWidth: 240,
    minWidth: 220,
    maxWidth: 360,
    collapsedWidth: 20
  };
  
  // 宽度拖拽相关状态
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(config.defaultWidth);
  const leftMarksRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<number>();
  
  // 从存储获取初始状态
  const initialState = LeftMarksStorage.getState();
  const [autoHide, setAutoHide] = useState(initialState.isCollapsed);
  const [flyoutHovered, setFlyoutHovered] = useState(false);
  const [flyoutPinned, setFlyoutPinned] = useState(false);
  const [width, setWidth] = useState(initialState.width);

  // 确保组件初始化后正确应用样式
  useEffect(() => {
    if (initialState.isCollapsed && width !== config.collapsedWidth) {
      setWidth(config.collapsedWidth);
      notifyWidthChange(config.collapsedWidth);
    }

    if (!initialState.isCollapsed && width !== initialState.width) {
      setWidth(initialState.width);
      notifyWidthChange(initialState.width);
    }

    notifyWidthChange(autoHide ? config.collapsedWidth : width);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoHide || !flyoutPinned) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (shellRef.current?.contains(target)) return;
      dismissFlyout();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissFlyout();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [autoHide, flyoutPinned]);

  // 通知 Layout 组件宽度变化
  const notifyWidthChange = (newWidth: number) => {
    window.dispatchEvent(new CustomEvent('leftMarksWidthChange', { 
      detail: { width: newWidth } 
    }));
  };

  const panelWidth = autoHide ? LeftMarksStorage.getPreviousWidth() : width;
  const isFlyoutVisible = flyoutHovered || flyoutPinned;

  const openFlyout = () => {
    if (!autoHide) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    setFlyoutHovered(true);
  };

  const closeFlyoutOnLeave = () => {
    if (!autoHide || flyoutPinned) return;
    hoverCloseTimer.current = window.setTimeout(() => {
      setFlyoutHovered(false);
    }, 160);
  };

  const pinFlyout = () => {
    if (!autoHide) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    setFlyoutPinned(true);
    setFlyoutHovered(true);
  };

  const dismissFlyout = () => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    setFlyoutPinned(false);
    setFlyoutHovered(false);
  };

  const enableAutoHide = () => {
    if (isResizing) return;

    LeftMarksStorage.savePreviousWidth(width);
    setAutoHide(true);
    dismissFlyout();
    setWidth(config.collapsedWidth);
    notifyWidthChange(config.collapsedWidth);
    LeftMarksStorage.saveState({ width: config.collapsedWidth, isCollapsed: true });
  };

  // 开始调整宽度
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = width;
    let currentWidth = width; // 用于跟踪当前宽度
    
    // 创建事件处理函数
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
      currentWidth = newWidth; // 更新当前宽度
      setWidth(newWidth);
      // 实时通知 Layout 组件宽度变化
      notifyWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      // 拖拽结束时保存最终宽度到存储
      LeftMarksStorage.saveState({ width: currentWidth, isCollapsed: false });
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderNav = () => (
    <>
      <div className="nav-profile">
        <div className="nav-profile-avatar">
          <Image src={mengsPhoto} preview={false} alt="李萌" />
        </div>
        <div className="nav-profile-info">
          <p className="nav-profile-name">李萌</p>
          <p className="nav-profile-role">前端工程师</p>
        </div>
      </div>

      <nav className="nav-menu" aria-label="站点导航">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/');
          }}
          className={`nav-link home-link${location.pathname === '/' ? ' is-active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Meng&apos;s home</span>
        </a>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/career');
          }}
          className={`nav-link career-link${location.pathname.startsWith('/career') ? ' is-active' : ''}`}
        >
          <span className="nav-icon">💻</span>
          <span className="nav-text">前端 Meng</span>
        </a>

        {location.pathname.startsWith('/career') && (
          <div className="nav-group-items">
            <div
              onClick={() => navigateWithMeng('/career/resume')}
              className={`sub-nav-item${location.pathname === '/career/resume' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📄</span>
              <span className="sub-nav-text">简历</span>
            </div>
            <div
              onClick={() => navigateWithMeng('/career/detail')}
              className={`sub-nav-item${location.pathname === '/career/detail' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🧭</span>
              <span className="sub-nav-text">工作介绍</span>
            </div>
            <div
              onClick={() => navigateWithMeng('/career/blogsTree')}
              className={`sub-nav-item${location.pathname === '/career/blogsTree' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🌳</span>
              <span className="sub-nav-text">知识树</span>
            </div>
            <div
              onClick={() => navigateWithMeng('/career/blogsWithTimeline')}
              className={`sub-nav-item${location.pathname === '/career/blogsWithTimeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📅</span>
              <span className="sub-nav-text">博客</span>
            </div>
          </div>
        )}

        {false && (
          <a href="/algorithm" className="nav-link algorithm-link">
            <span className="nav-icon">🧮</span>
            <span className="nav-text">算法 Meng</span>
          </a>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/photography');
          }}
          className={`nav-link photography-link${location.pathname.startsWith('/photography') ? ' is-active' : ''}`}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-text">摄影师 Meng</span>
        </a>

        {location.pathname.startsWith('/photography') && (
          <div className="nav-group-items">
            <div
              onClick={() => navigateWithMeng('/photography/introduction')}
              className={`sub-nav-item${location.pathname === '/photography/introduction' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📖</span>
              <span className="sub-nav-text">介绍</span>
            </div>
            <div
              onClick={() => navigateWithMeng('/photography/pictures')}
              className={`sub-nav-item${location.pathname === '/photography/pictures' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🖼️</span>
              <span className="sub-nav-text">底片们</span>
            </div>
            <div
              onClick={() => navigateWithMeng('/photography/timeline')}
              className={`sub-nav-item${location.pathname === '/photography/timeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">⏰</span>
              <span className="sub-nav-text">拍摄时间线</span>
            </div>
            {searchParams.get('meng') === 'true' && (
              <div
                onClick={() => {
                  window.location.href = '/photography/management?meng=true';
                }}
                className={`sub-nav-item${location.pathname === '/photography/management' ? ' active' : ''}`}
              >
                <span className="sub-nav-icon">📁</span>
                <span className="sub-nav-text">底片管理</span>
              </div>
            )}
          </div>
        )}

        {searchParams.get('meng') === 'true' && (
          <a
            href="/writing?meng=true"
            className={`nav-link writing-link${location.pathname === '/writing' ? ' is-active' : ''}`}
          >
            <span className="nav-icon">✍️</span>
            <span className="nav-text">Meng&apos;s 碎碎念</span>
          </a>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/todo');
          }}
          className={`nav-link todo-link${location.pathname === '/todo' ? ' is-active' : ''}`}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-text">每日待办</span>
        </a>
      </nav>
    </>
  );

  if (autoHide) {
    return (
      <div
        ref={shellRef}
        className={`left-marks-shell left-marks-shell--auto-hide${isFlyoutVisible ? " is-open" : ""}${flyoutPinned ? " is-pinned" : ""}`}
      >
        <div
          className="left-marks-trigger"
          title="悬停或点击展开导航"
          onMouseEnter={openFlyout}
          onMouseLeave={closeFlyoutOnLeave}
          onClick={pinFlyout}
        >
          <span className="left-marks-trigger-line" aria-hidden="true" />
          <span className="left-marks-trigger-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div
          ref={leftMarksRef}
          className="left-marks left-marks--flyout"
          style={{ width: panelWidth }}
          onMouseEnter={openFlyout}
          onMouseLeave={closeFlyoutOnLeave}
          onMouseDown={pinFlyout}
        >
          {renderNav()}
        </div>
      </div>
    );
  }

  return (
    <div className="left-marks-shell">
      <div
        ref={leftMarksRef}
        className="left-marks"
        style={{ width: panelWidth }}
      >
        <div
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleResizeStart}
          title="拖拽调整宽度"
        />

        <div
          className="collapse-button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            let isDragging = false;
            let startX = e.clientX;
            let startWidth = width;

            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              if (Math.abs(deltaX) > 5) {
                isDragging = true;
                setIsResizing(true);

                const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
                setWidth(newWidth);
                notifyWidthChange(newWidth);
              }
            };

            const handleMouseUp = (mouseUpEvent: MouseEvent) => {
              if (isDragging) {
                setIsResizing(false);
                const finalWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + (mouseUpEvent.clientX - startX)));
                LeftMarksStorage.saveState({ width: finalWidth, isCollapsed: false });
              } else {
                enableAutoHide();
              }

              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          title="悬停模式：点击收起为左侧悬停展开"
        >
          <span className="collapse-button-icon collapse-button-icon--collapse">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        {renderNav()}
      </div>
    </div>
  );
};

export default LeftMarks;
