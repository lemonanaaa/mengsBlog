import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { Image } from 'antd';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { mengsBlogContext } from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";

/** 跨路由保持侧栏状态（每页各自包 Layout 会卸载 LeftMarks） */
const flyoutSession = {
  pinned: false,
  hovered: false,
  docked: false,
};

interface LeftMarksConfig {
  defaultWidth: number;
  collapsedWidth: number;
}

interface LeftMarksState {
  width: number;
  isCollapsed: boolean;
  previousWidth: number;
}

export class LeftMarksStorage {
  private static readonly STORAGE_KEY = 'leftMarksState';

  static getState(): LeftMarksState {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Failed to parse leftMarks state from localStorage:', error);
    }

    return {
      width: 240,
      isCollapsed: true,
      previousWidth: 240,
    };
  }

  static saveState(state: Partial<LeftMarksState>): void {
    try {
      const currentState = this.getState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save leftMarks state to localStorage:', error);
    }
  }

  static getPreviousWidth(): number {
    try {
      const state = this.getState();
      return state.previousWidth;
    } catch (error) {
      console.warn('Failed to get previous width from state:', error);
      return 240;
    }
  }

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
  useContext(mengsBlogContext);

  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  const config: LeftMarksConfig = {
    defaultWidth: 240,
    collapsedWidth: 20,
  };

  const leftMarksRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<number>();
  const pointerInContentRef = useRef(false);
  const flyoutPinnedRef = useRef(flyoutSession.pinned);

  const [flyoutHovered, setFlyoutHovered] = useState(
    () => flyoutSession.pinned || flyoutSession.hovered || flyoutSession.docked
  );
  const [flyoutPinned, setFlyoutPinned] = useState(
    () => flyoutSession.pinned || flyoutSession.docked
  );
  const [docked, setDocked] = useState(() => flyoutSession.docked);

  const panelWidth = LeftMarksStorage.getPreviousWidth() || config.defaultWidth;
  const isFlyoutVisible = docked || flyoutHovered || flyoutPinned;

  const notifyWidthChange = (newWidth: number) => {
    window.dispatchEvent(new CustomEvent('leftMarksWidthChange', {
      detail: { width: newWidth },
    }));
  };

  const dismissFlyout = useCallback(() => {
    if (flyoutSession.docked) return;

    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    pointerInContentRef.current = false;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setFlyoutPinned(false);
    setFlyoutHovered(false);
  }, []);

  const undockFlyout = useCallback(() => {
    flyoutSession.docked = false;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setDocked(false);
    setFlyoutPinned(false);
    setFlyoutHovered(false);
    notifyWidthChange(config.collapsedWidth);
    LeftMarksStorage.saveState({ width: config.collapsedWidth, isCollapsed: true });
  }, [config.collapsedWidth]);

  const dockFlyout = useCallback(() => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    flyoutSession.docked = true;
    flyoutSession.pinned = true;
    flyoutSession.hovered = true;
    flyoutPinnedRef.current = true;
    setDocked(true);
    setFlyoutPinned(true);
    setFlyoutHovered(true);
    notifyWidthChange(panelWidth);
    LeftMarksStorage.saveState({
      width: panelWidth,
      isCollapsed: false,
      previousWidth: panelWidth,
    });
  }, [panelWidth]);

  const toggleDock = useCallback(() => {
    if (flyoutSession.docked) {
      undockFlyout();
    } else {
      dockFlyout();
    }
  }, [dockFlyout, undockFlyout]);

  const openFlyout = useCallback(() => {
    if (flyoutSession.docked || flyoutPinnedRef.current || flyoutSession.pinned) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    flyoutSession.hovered = true;
    setFlyoutHovered(true);
  }, []);

  const closeFlyoutOnLeave = useCallback(() => {
    if (flyoutSession.docked || flyoutPinnedRef.current || flyoutSession.pinned) return;

    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    hoverCloseTimer.current = window.setTimeout(() => {
      if (flyoutPinnedRef.current || flyoutSession.pinned) return;
      flyoutSession.hovered = false;
      setFlyoutHovered(false);
    }, 180);
  }, []);

  const pinFlyout = useCallback(() => {
    if (flyoutSession.docked) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    flyoutSession.pinned = true;
    flyoutSession.hovered = true;
    flyoutPinnedRef.current = true;
    setFlyoutPinned(true);
    setFlyoutHovered(true);
  }, []);

  const handleFlyoutPointerDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    pinFlyout();
  };

  const navigateAndPin = (path: string) => {
    pinFlyout();
    navigateWithMeng(path);
  };

  useEffect(() => {
    const state = LeftMarksStorage.getState();
    const shouldDock = !state.isCollapsed && state.width > config.collapsedWidth;

    if (shouldDock || flyoutSession.docked) {
      flyoutSession.docked = true;
      flyoutSession.pinned = true;
      flyoutSession.hovered = true;
      flyoutPinnedRef.current = true;
      setDocked(true);
      setFlyoutPinned(true);
      setFlyoutHovered(true);
      notifyWidthChange(shouldDock ? state.width : panelWidth);
    } else {
      notifyWidthChange(config.collapsedWidth);
    }

    LeftMarksStorage.saveState({
      width: flyoutSession.docked ? panelWidth : config.collapsedWidth,
      isCollapsed: !flyoutSession.docked,
      previousWidth: panelWidth,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!flyoutPinned || flyoutSession.docked) return;

    const updatePointerInContent = (clientX: number, clientY: number) => {
      const layoutRight = document.querySelector(".layout-right");
      if (!layoutRight) {
        pointerInContentRef.current = false;
        return;
      }

      const rect = layoutRight.getBoundingClientRect();
      pointerInContentRef.current =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointerInContent(event.clientX, event.clientY);
    };

    const dismissIfPointerInContent = () => {
      if (!flyoutPinnedRef.current) return;
      if (pointerInContentRef.current) {
        dismissFlyout();
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!flyoutPinnedRef.current || !pointerInContentRef.current) return;
      if (event.deltaY === 0 && event.deltaX === 0) return;
      dismissFlyout();
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("scroll", dismissIfPointerInContent, { passive: true, capture: true });
    document.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("scroll", dismissIfPointerInContent, true);
      document.removeEventListener("wheel", handleWheel);
    };
  }, [flyoutPinned, dismissFlyout]);

  const renderPinButton = () => (
    <button
      type="button"
      className={`left-marks-pin-btn${docked ? " is-docked" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleDock();
      }}
      title={docked ? "取消固定侧栏" : "固定侧栏并重排内容"}
      aria-label={docked ? "取消固定侧栏" : "固定侧栏并重排内容"}
      aria-pressed={docked}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.5 5.8 6H3.5v2h1.1L5 12.5h6l.4-4.5h1.1V6h-2.3L8 1.5Z"
          fill="currentColor"
          opacity={docked ? 1 : 0.82}
        />
        <path
          d="M6.2 12.5v2.2c0 .45.37.8.8.8h1.9c.46 0 .8-.35.8-.8v-2.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );

  const renderNav = () => (
    <>
      <div className="nav-profile">
        <div className="nav-profile-main">
          <div className="nav-profile-avatar">
            <Image src={mengsPhoto} preview={false} alt="李萌" />
          </div>
          <div className="nav-profile-info">
            <p className="nav-profile-name">李萌</p>
            <p className="nav-profile-role">前端工程师</p>
          </div>
        </div>
        {renderPinButton()}
      </div>

      <nav className="nav-menu" aria-label="站点导航">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateAndPin('/');
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
            navigateAndPin('/career');
          }}
          className={`nav-link career-link${location.pathname.startsWith('/career') ? ' is-active' : ''}`}
        >
          <span className="nav-icon">💻</span>
          <span className="nav-text">前端 Meng</span>
        </a>

        {location.pathname.startsWith('/career') && (
          <div className="nav-group-items">
            <div
              onClick={() => navigateAndPin('/career/resume')}
              className={`sub-nav-item${location.pathname === '/career/resume' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📄</span>
              <span className="sub-nav-text">简历</span>
            </div>
            <div
              onClick={() => navigateAndPin('/career/detail')}
              className={`sub-nav-item${location.pathname === '/career/detail' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🧭</span>
              <span className="sub-nav-text">工作介绍</span>
            </div>
            <div
              onClick={() => navigateAndPin('/career/blogsTree')}
              className={`sub-nav-item${location.pathname === '/career/blogsTree' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🌳</span>
              <span className="sub-nav-text">知识树</span>
            </div>
            <div
              onClick={() => navigateAndPin('/career/blogsWithTimeline')}
              className={`sub-nav-item${location.pathname === '/career/blogsWithTimeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📅</span>
              <span className="sub-nav-text">博客</span>
            </div>
          </div>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateAndPin('/photography');
          }}
          className={`nav-link photography-link${location.pathname.startsWith('/photography') ? ' is-active' : ''}`}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-text">摄影师 Meng</span>
        </a>

        {location.pathname.startsWith('/photography') && (
          <div className="nav-group-items">
            <div
              onClick={() => navigateAndPin('/photography/introduction')}
              className={`sub-nav-item${location.pathname === '/photography/introduction' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📖</span>
              <span className="sub-nav-text">介绍</span>
            </div>
            <div
              onClick={() => navigateAndPin('/photography/pictures')}
              className={`sub-nav-item${location.pathname === '/photography/pictures' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🖼️</span>
              <span className="sub-nav-text">底片们</span>
            </div>
            <div
              onClick={() => navigateAndPin('/photography/timeline')}
              className={`sub-nav-item${location.pathname === '/photography/timeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">⏰</span>
              <span className="sub-nav-text">拍摄时间线</span>
            </div>
            {searchParams.get('meng') === 'true' && (
              <div
                onClick={() => {
                  pinFlyout();
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
            onClick={(e) => {
              e.preventDefault();
              pinFlyout();
              window.location.href = '/writing?meng=true';
            }}
          >
            <span className="nav-icon">✍️</span>
            <span className="nav-text">Meng&apos;s 碎碎念</span>
          </a>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateAndPin('/todo');
          }}
          className={`nav-link todo-link${location.pathname === '/todo' ? ' is-active' : ''}`}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-text">每日待办</span>
        </a>
      </nav>
    </>
  );

  return (
    <div
      ref={shellRef}
      className={`left-marks-shell left-marks-shell--auto-hide${
        docked ? " left-marks-shell--docked" : ""
      }${isFlyoutVisible ? " is-open" : ""}${
        flyoutPinned && !docked ? " is-pinned" : ""
      }`}
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyoutOnLeave}
    >
      {!docked && (
        <div
          className="left-marks-trigger"
          title="悬停展开导航"
          onMouseDown={(e) => {
            if (e.button === 0) openFlyout();
          }}
        >
          <span className="left-marks-trigger-line" aria-hidden="true" />
          <span className="left-marks-trigger-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      )}

      <div
        ref={leftMarksRef}
        className="left-marks left-marks--flyout"
        style={{ width: panelWidth }}
        onMouseDown={docked ? undefined : handleFlyoutPointerDown}
      >
        {renderNav()}
      </div>
    </div>
  );
};

export default LeftMarks;
