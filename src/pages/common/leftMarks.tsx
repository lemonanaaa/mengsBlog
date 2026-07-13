import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import { Image } from 'antd';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { mengsBlogContext } from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";
import SidebarOnboarding from "./SidebarOnboarding";

const MOBILE_RAIL_WIDTH = 40;

type MobileLayoutMode = "icon-rail" | "expanded" | "collapsed";
type MobileSubmenuKey = "career" | "photography";
type NavRenderMode = "desktop" | "mobile-rail" | "mobile-full";

/** 跨路由保持侧栏状态（每页各自包 Layout 会卸载 LeftMarks） */
const flyoutSession = {
  pinned: false,
  hovered: false,
  docked: false,
  mobileMode: "icon-rail" as MobileLayoutMode,
  mobileSlotMode: "icon-rail" as "icon-rail" | "collapsed",
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

  const isCoarsePointerDevice = () =>
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;

  const config: LeftMarksConfig = {
    defaultWidth: 240,
    collapsedWidth: 20,
  };

  const leftMarksRef = useRef<HTMLDivElement>(null);
  const pinBtnRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const careerLinkRef = useRef<HTMLAnchorElement>(null);
  const photographyLinkRef = useRef<HTMLAnchorElement>(null);
  const hoverCloseTimer = useRef<number>();
  const pointerInContentRef = useRef(false);
  const flyoutPinnedRef = useRef(flyoutSession.pinned);
  const mobileSlotModeRef = useRef<"icon-rail" | "collapsed">(
    flyoutSession.mobileSlotMode || "icon-rail",
  );

  const [flyoutHovered, setFlyoutHovered] = useState(
    () => flyoutSession.pinned || flyoutSession.hovered || flyoutSession.docked
  );
  const [flyoutPinned, setFlyoutPinned] = useState(
    () => flyoutSession.pinned || flyoutSession.docked
  );
  const [docked, setDocked] = useState(() => flyoutSession.docked);
  const [guideLockOpen, setGuideLockOpen] = useState(false);
  const [guidePinStep, setGuidePinStep] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(isCoarsePointerDevice);
  const [mobileMode, setMobileMode] = useState<MobileLayoutMode>(
    () => flyoutSession.mobileMode || "icon-rail",
  );
  const [mobileSubmenu, setMobileSubmenu] = useState<MobileSubmenuKey | null>(null);
  const [mobileSubmenuTop, setMobileSubmenuTop] = useState(0);

  const panelWidth = LeftMarksStorage.getPreviousWidth() || config.defaultWidth;
  const isMobileIconRail = isCoarsePointer && mobileMode === "icon-rail";
  const isMobileExpanded = isCoarsePointer && mobileMode === "expanded";
  const isMobileCollapsed = isCoarsePointer && mobileMode === "collapsed";
  const isFlyoutOverlayOpen = !isCoarsePointer && (flyoutHovered || flyoutPinned || guideLockOpen);
  const isFlyoutVisible = isCoarsePointer
    ? mobileMode !== "collapsed"
    : docked || flyoutHovered || flyoutPinned || guideLockOpen;
  const flyoutPanelWidth = isCoarsePointer ? MOBILE_RAIL_WIDTH : panelWidth;

  const notifyWidthChange = (newWidth: number) => {
    window.dispatchEvent(new CustomEvent('leftMarksWidthChange', {
      detail: { width: newWidth },
    }));
  };

  const dismissFlyout = useCallback(() => {
    if (guideLockOpen) return;

    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }

    if (isCoarsePointer && flyoutSession.mobileMode === "icon-rail") {
      pointerInContentRef.current = false;
      flyoutSession.pinned = false;
      flyoutSession.hovered = false;
      flyoutPinnedRef.current = false;
      setFlyoutPinned(false);
      setFlyoutHovered(false);
      return;
    }

    if (flyoutSession.docked) return;

    pointerInContentRef.current = false;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setFlyoutPinned(false);
    setFlyoutHovered(false);
  }, [guideLockOpen, isCoarsePointer]);

  const enterMobileIconRail = useCallback(() => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }

    pointerInContentRef.current = false;
    flyoutSession.mobileMode = "icon-rail";
    flyoutSession.mobileSlotMode = "icon-rail";
    mobileSlotModeRef.current = "icon-rail";
    flyoutSession.docked = true;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setMobileMode("icon-rail");
    setDocked(true);
    setFlyoutPinned(false);
    setFlyoutHovered(false);
    setMobileSubmenu(null);
    notifyWidthChange(MOBILE_RAIL_WIDTH);
  }, []);

  const enterMobileCollapsed = useCallback(() => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }

    pointerInContentRef.current = false;
    flyoutSession.mobileMode = "collapsed";
    flyoutSession.mobileSlotMode = "collapsed";
    mobileSlotModeRef.current = "collapsed";
    flyoutSession.docked = true;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setMobileMode("collapsed");
    setDocked(true);
    setFlyoutPinned(false);
    setFlyoutHovered(false);
    setMobileSubmenu(null);
    notifyWidthChange(config.collapsedWidth);
  }, [config.collapsedWidth]);

  const enterMobileExpanded = useCallback(() => {
    setMobileMode((current) => {
      if (current === "icon-rail" || current === "collapsed") {
        mobileSlotModeRef.current = current;
        flyoutSession.mobileSlotMode = current;
      }
      flyoutSession.mobileMode = "expanded";
      return "expanded";
    });
    setMobileSubmenu(null);
  }, []);

  const dismissMobileExpanded = useCallback(() => {
    if (flyoutSession.mobileSlotMode === "collapsed") {
      enterMobileCollapsed();
      return;
    }
    enterMobileIconRail();
  }, [enterMobileCollapsed, enterMobileIconRail]);

  const closeMobileSubmenu = useCallback(() => {
    setMobileSubmenu(null);
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

  const ensureFlyoutOpenForGuide = useCallback(() => {
    if (flyoutSession.docked) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    flyoutSession.hovered = true;
    setFlyoutHovered(true);
  }, []);

  const handleGuideActiveChange = useCallback((active: boolean) => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    setGuideLockOpen(active);
    if (active) {
      ensureFlyoutOpenForGuide();
    }
  }, [ensureFlyoutOpenForGuide]);

  const openFlyout = useCallback(() => {
    if (isCoarsePointer || flyoutSession.docked || flyoutPinnedRef.current || flyoutSession.pinned) return;
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
    flyoutSession.hovered = true;
    setFlyoutHovered(true);
  }, [isCoarsePointer]);

  const closeFlyoutOnLeave = useCallback(() => {
    if (guideLockOpen || flyoutSession.docked || flyoutPinnedRef.current || flyoutSession.pinned) return;

    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
    }
    hoverCloseTimer.current = window.setTimeout(() => {
      if (guideLockOpen || flyoutPinnedRef.current || flyoutSession.pinned) return;
      flyoutSession.hovered = false;
      setFlyoutHovered(false);
    }, 180);
  }, [guideLockOpen]);

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

  const handleNavClick = (path: string) => {
    navigateWithMeng(path);
    if (isMobileExpanded) return;
    if (isCoarsePointer) {
      enterMobileIconRail();
    } else {
      pinFlyout();
    }
  };

  const handleExternalNavClick = () => {
    if (isMobileExpanded) return;
    if (isCoarsePointer) {
      enterMobileIconRail();
      setMobileSubmenu(null);
    } else {
      pinFlyout();
    }
  };

  const syncMobileSubmenuAnchor = useCallback((key: MobileSubmenuKey) => {
    const anchor = key === "career" ? careerLinkRef.current : photographyLinkRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setMobileSubmenuTop(rect.top + rect.height / 2);
  }, []);

  const handleMobileCategoryTap = (
    key: MobileSubmenuKey,
    fallbackPath: string,
  ) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isMobileIconRail) {
      setMobileSubmenu((prev) => {
        const next = prev === key ? null : key;
        if (next) {
          requestAnimationFrame(() => syncMobileSubmenuAnchor(key));
        }
        return next;
      });
      return;
    }
    if (isMobileExpanded) {
      navigateWithMeng(fallbackPath);
      return;
    }
    handleNavClick(fallbackPath);
  };

  const handleMobileRailSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobileIconRail) return;
    const target = event.target as HTMLElement;
    if (target.closest("a.nav-link, button")) return;
    enterMobileExpanded();
  };

  const renderMobileSubmenu = () => {
    if (!isMobileIconRail || !mobileSubmenu) return null;

    const careerItems = [
      { path: "/career/resume", icon: "📄", label: "简历" },
      { path: "/career/detail", icon: "🧭", label: "工作介绍" },
      { path: "/career/blogsTree", icon: "🌳", label: "知识树" },
      { path: "/career/blogsWithTimeline", icon: "📅", label: "博客" },
    ];

    const photographyItems = [
      { path: "/photography/introduction", icon: "📖", label: "介绍" },
      { path: "/photography/pictures", icon: "🖼️", label: "底片们" },
      { path: "/photography/timeline", icon: "⏰", label: "拍摄时间线" },
      ...(searchParams.get("meng") === "true"
        ? [{ path: "/photography/management?meng=true", icon: "📁", label: "底片管理" }]
        : []),
    ];

    const items = mobileSubmenu === "career" ? careerItems : photographyItems;

    return (
      <>
        <button
          type="button"
          className="left-marks-backdrop left-marks-backdrop--submenu"
          aria-label="关闭分类菜单"
          onClick={closeMobileSubmenu}
        />
        <div
          className="left-marks-mobile-submenu"
          style={{ left: MOBILE_RAIL_WIDTH, top: mobileSubmenuTop }}
          role="menu"
          aria-label={mobileSubmenu === "career" ? "前端 Meng" : "摄影师 Meng"}
        >
          <div className="left-marks-mobile-submenu-list">
            {items.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`left-marks-mobile-submenu-item${
                  location.pathname === item.path.split("?")[0] ? " is-active" : ""
                }`}
                onClick={() => {
                  if (item.path.includes("?")) {
                    enterMobileIconRail();
                    setMobileSubmenu(null);
                    window.location.href = item.path;
                    return;
                  }
                  navigateWithMeng(item.path);
                  enterMobileIconRail();
                  setMobileSubmenu(null);
                }}
              >
                <span className="left-marks-mobile-submenu-icon" aria-hidden="true">{item.icon}</span>
                <span className="left-marks-mobile-submenu-text">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  useEffect(() => {
    if (!isCoarsePointer || !mobileSubmenu) return;

    const syncAnchor = () => syncMobileSubmenuAnchor(mobileSubmenu);
    syncAnchor();
    window.addEventListener("resize", syncAnchor);
    window.addEventListener("scroll", syncAnchor, true);
    return () => {
      window.removeEventListener("resize", syncAnchor);
      window.removeEventListener("scroll", syncAnchor, true);
    };
  }, [isCoarsePointer, mobileSubmenu, syncMobileSubmenuAnchor]);

  useEffect(() => {
    const syncPointerMode = () => setIsCoarsePointer(isCoarsePointerDevice());
    const media = window.matchMedia("(pointer: coarse)");
    media.addEventListener("change", syncPointerMode);
    window.addEventListener("resize", syncPointerMode);
    return () => {
      media.removeEventListener("change", syncPointerMode);
      window.removeEventListener("resize", syncPointerMode);
    };
  }, []);

  useEffect(() => {
    if (!isCoarsePointer) return;

    flyoutSession.docked = true;
    flyoutSession.pinned = false;
    flyoutSession.hovered = false;
    flyoutPinnedRef.current = false;
    setDocked(true);
    setFlyoutPinned(false);
    setFlyoutHovered(false);
    setMobileSubmenu(null);

    const mode = flyoutSession.mobileMode || "icon-rail";
    const slotWidth =
      flyoutSession.mobileSlotMode === "collapsed"
        ? config.collapsedWidth
        : MOBILE_RAIL_WIDTH;

    if (mode === "expanded") {
      mobileSlotModeRef.current = flyoutSession.mobileSlotMode || "icon-rail";
      setMobileMode("expanded");
      notifyWidthChange(slotWidth);
      return;
    }

    if (mode === "collapsed") {
      mobileSlotModeRef.current = "collapsed";
      setMobileMode("collapsed");
      notifyWidthChange(config.collapsedWidth);
      return;
    }

    mobileSlotModeRef.current = "icon-rail";
    flyoutSession.mobileMode = "icon-rail";
    flyoutSession.mobileSlotMode = "icon-rail";
    setMobileMode("icon-rail");
    notifyWidthChange(MOBILE_RAIL_WIDTH);
  }, [isCoarsePointer, config.collapsedWidth]);

  useEffect(() => {
    if (isCoarsePointer) return;

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
  }, [isCoarsePointer, config.collapsedWidth, panelWidth]);

  const handleTriggerOpen = useCallback(() => {
    if (flyoutSession.docked || flyoutPinnedRef.current || flyoutSession.pinned) return;
    openFlyout();
  }, [openFlyout]);

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!flyoutPinned || flyoutSession.docked || isCoarsePointer) return;

    // 侧栏被 pin 住（打开但未固定）时，只要鼠标移出面板右边缘、进入右侧内容区，
    // 就立即收起——不再需要额外的滚动/滚轮操作。
    const handleMouseMove = (event: MouseEvent) => {
      if (!flyoutPinnedRef.current || flyoutSession.docked) return;

      const panel = leftMarksRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      if (event.clientX > rect.right) {
        dismissFlyout();
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [flyoutPinned, isCoarsePointer, dismissFlyout]);

  const renderPinButton = (mobileExpanded = false) => (
    <button
      ref={mobileExpanded ? undefined : pinBtnRef}
      type="button"
      className={`left-marks-pin-btn${docked && !mobileExpanded ? " is-docked" : ""}${guidePinStep ? " is-onboarding-target" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        if (mobileExpanded) {
          enterMobileIconRail();
          return;
        }
        toggleDock();
      }}
      title={mobileExpanded ? "固定为图标栏" : docked ? "取消固定侧栏" : "固定侧栏并重排内容"}
      aria-label={mobileExpanded ? "固定为图标栏" : docked ? "取消固定侧栏" : "固定侧栏并重排内容"}
      aria-pressed={mobileExpanded ? false : docked}
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

  const renderMobileCollapseButton = () => (
    <button
      type="button"
      className="left-marks-mobile-collapse-btn"
      onClick={(e) => {
        e.stopPropagation();
        enterMobileCollapsed();
      }}
      title="收起导航"
      aria-label="收起导航"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M10 4 6 8l4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>完全收起</span>
    </button>
  );

  const renderNav = (navMode: NavRenderMode = "desktop") => {
    const showInlineSubNav = navMode === "desktop" || navMode === "mobile-full";
    const showHeaderControls = navMode === "desktop" || navMode === "mobile-full";
    const isMobileFull = navMode === "mobile-full";

    return (
    <>
      <div className="nav-profile">
        <div className="nav-profile-main">
          <div
            className="nav-profile-avatar"
            onClick={isMobileIconRail ? (e) => {
              e.stopPropagation();
              enterMobileExpanded();
            } : undefined}
            onKeyDown={isMobileIconRail ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                enterMobileExpanded();
              }
            } : undefined}
            role={isMobileIconRail ? "button" : undefined}
            tabIndex={isMobileIconRail ? 0 : undefined}
            aria-label={isMobileIconRail ? "展开完整导航" : undefined}
          >
            <Image src={mengsPhoto} preview={false} alt="李萌" />
          </div>
          <div className="nav-profile-info">
            <p className="nav-profile-name">李萌</p>
            <p className="nav-profile-role">前端工程师</p>
          </div>
        </div>
        {showHeaderControls && (
          <div className="nav-profile-actions">
            {renderPinButton(isMobileFull)}
          </div>
        )}
      </div>

      <nav className="nav-menu" aria-label="站点导航">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('/');
          }}
          className={`nav-link home-link${location.pathname === '/' ? ' is-active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Meng&apos;s home</span>
        </a>

        <a
          ref={careerLinkRef}
          href="#"
          onClick={handleMobileCategoryTap("career", "/career")}
          className={`nav-link career-link${location.pathname.startsWith('/career') ? ' is-active' : ''}${
            mobileSubmenu === "career" ? " is-submenu-open" : ""
          }`}
        >
          <span className="nav-icon">💻</span>
          <span className="nav-text">前端 Meng</span>
        </a>

        {showInlineSubNav && location.pathname.startsWith('/career') && (
          <div className="nav-group-items">
            <div
              onClick={() => handleNavClick('/career/resume')}
              className={`sub-nav-item${location.pathname === '/career/resume' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📄</span>
              <span className="sub-nav-text">简历</span>
            </div>
            <div
              onClick={() => handleNavClick('/career/detail')}
              className={`sub-nav-item${location.pathname === '/career/detail' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🧭</span>
              <span className="sub-nav-text">工作介绍</span>
            </div>
            <div
              onClick={() => handleNavClick('/career/blogsTree')}
              className={`sub-nav-item${location.pathname === '/career/blogsTree' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🌳</span>
              <span className="sub-nav-text">知识树</span>
            </div>
            <div
              onClick={() => handleNavClick('/career/blogsWithTimeline')}
              className={`sub-nav-item${location.pathname === '/career/blogsWithTimeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📅</span>
              <span className="sub-nav-text">博客</span>
            </div>
          </div>
        )}

        <a
          ref={photographyLinkRef}
          href="#"
          onClick={handleMobileCategoryTap("photography", "/photography")}
          className={`nav-link photography-link${location.pathname.startsWith('/photography') ? ' is-active' : ''}${
            mobileSubmenu === "photography" ? " is-submenu-open" : ""
          }`}
        >
          <span className="nav-icon">📸</span>
          <span className="nav-text">摄影师 Meng</span>
        </a>

        {showInlineSubNav && location.pathname.startsWith('/photography') && (
          <div className="nav-group-items">
            <div
              onClick={() => handleNavClick('/photography/introduction')}
              className={`sub-nav-item${location.pathname === '/photography/introduction' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">📖</span>
              <span className="sub-nav-text">介绍</span>
            </div>
            <div
              onClick={() => handleNavClick('/photography/pictures')}
              className={`sub-nav-item${location.pathname === '/photography/pictures' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">🖼️</span>
              <span className="sub-nav-text">底片们</span>
            </div>
            <div
              onClick={() => handleNavClick('/photography/timeline')}
              className={`sub-nav-item${location.pathname === '/photography/timeline' ? ' active' : ''}`}
            >
              <span className="sub-nav-icon">⏰</span>
              <span className="sub-nav-text">拍摄时间线</span>
            </div>
            {searchParams.get('meng') === 'true' && (
              <div
                onClick={() => {
                  handleExternalNavClick();
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
              handleExternalNavClick();
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
            handleNavClick('/todo');
          }}
          className={`nav-link todo-link${location.pathname === '/todo' ? ' is-active' : ''}`}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-text">每日待办</span>
        </a>
      </nav>
      {isMobileFull && (
        <div className="left-marks-mobile-footer">
          {renderMobileCollapseButton()}
        </div>
      )}
    </>
    );
  };

  const isHome = location.pathname === "/";

  return (
    <>
    {renderMobileSubmenu()}

    {isMobileExpanded && (
      <>
        <button
          type="button"
          className="left-marks-backdrop left-marks-backdrop--mobile-nav"
          aria-label="关闭导航"
          onClick={dismissMobileExpanded}
        />
        <div className="left-marks-mobile-expanded">
          <div className="left-marks left-marks--flyout">
            {renderNav("mobile-full")}
          </div>
        </div>
      </>
    )}

    <div
      ref={shellRef}
      className={`left-marks-shell left-marks-shell--auto-hide${
        docked || isMobileIconRail || isMobileCollapsed ? " left-marks-shell--docked" : ""
      }${isFlyoutVisible ? " is-open" : ""}${
        flyoutPinned && !docked ? " is-pinned" : ""
      }${guidePinStep ? " is-guide-pin" : ""}${isCoarsePointer ? " is-touch" : ""}${
        isMobileIconRail ? " left-marks-shell--mobile-rail" : ""
      }${isMobileCollapsed ? " left-marks-shell--mobile-collapsed" : ""}${
        isMobileExpanded ? " left-marks-shell--mobile-expanded-open" : ""
      }`}
      onMouseEnter={isCoarsePointer ? undefined : openFlyout}
      onMouseLeave={isCoarsePointer ? undefined : closeFlyoutOnLeave}
    >
      {!isCoarsePointer && !docked && (
        <div
          className="left-marks-trigger"
          title="悬停展开导航"
          role="button"
          tabIndex={0}
          aria-label="展开导航"
          aria-expanded={isFlyoutVisible}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            handleTriggerOpen();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTriggerOpen();
            }
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

      {isMobileCollapsed && (
        <div
          className="left-marks-trigger left-marks-trigger--mobile-collapsed"
          title="展开导航"
          role="button"
          tabIndex={0}
          aria-label="展开导航"
          aria-expanded={false}
          onClick={() => enterMobileExpanded()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              enterMobileExpanded();
            }
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

      {isMobileIconRail && (
      <div
        ref={leftMarksRef}
        className="left-marks left-marks--flyout"
        style={{ width: flyoutPanelWidth }}
        onClick={handleMobileRailSurfaceClick}
      >
        {renderNav("mobile-rail")}
      </div>
      )}

      {!isCoarsePointer && (
      <div
        ref={leftMarksRef}
        className="left-marks left-marks--flyout"
        style={{ width: flyoutPanelWidth }}
        onMouseDown={docked ? undefined : handleFlyoutPointerDown}
      >
        {renderNav("desktop")}
      </div>
      )}
    </div>

    <SidebarOnboarding
      enabled={isHome && !docked && !isCoarsePointer}
      flyoutVisible={isFlyoutOverlayOpen && !docked}
      docked={docked}
      pinButtonRef={pinBtnRef}
      onGuideActiveChange={handleGuideActiveChange}
      onEnsureFlyoutOpen={ensureFlyoutOpenForGuide}
      onPinStepChange={setGuidePinStep}
    />
    </>
  );
};

export default LeftMarks;
