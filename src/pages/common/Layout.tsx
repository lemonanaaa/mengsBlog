import React, { createContext, useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../../css/common/layout.css";
import "../../css/common/homeButton.css";
import { getUrlWithMeng } from "../../utils/navigation";

import LeftMarks, { LeftMarksStorage } from "./leftMarks";
import LeftMarksForGuest from "./LeftMarksForGuest"
import VisitTracker from "./VisitTracker";

export const mengsBlogContext = createContext({});

const LEFT_SLOT_WIDTH = 20;
const MOBILE_RAIL_WIDTH = 40;

const isMobileLayout = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768);

const getInitialLeftWidth = () => {
  if (isMobileLayout()) {
    return MOBILE_RAIL_WIDTH;
  }

  try {
    const state = LeftMarksStorage.getState();
    if (!state.isCollapsed && state.width > LEFT_SLOT_WIDTH) {
      return state.width;
    }
  } catch {
    // ignore
  }
  return LEFT_SLOT_WIDTH;
};

const Layout = (props) => {
  const { children, leftType = 'normal' } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHome = location.pathname === "/";
  const [blogCommonStore, setBlogCommonStore] = useState({})
  const [leftWidth, setLeftWidth] = useState(getInitialLeftWidth);
  const [isMobile, setIsMobile] = useState(isMobileLayout);

  useEffect(() => {
    const handleWidthChange = (e: CustomEvent<{ width?: number }>) => {
      if (e.detail?.width) {
        setLeftWidth(e.detail.width);
      }
    };

    window.addEventListener("leftMarksWidthChange", handleWidthChange as EventListener);
    return () => {
      window.removeEventListener("leftMarksWidthChange", handleWidthChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const syncPointerMode = () => setIsMobile(isMobileLayout());
    const media = window.matchMedia("(pointer: coarse)");
    media.addEventListener("change", syncPointerMode);
    window.addEventListener("resize", syncPointerMode);
    return () => {
      media.removeEventListener("change", syncPointerMode);
      window.removeEventListener("resize", syncPointerMode);
    };
  }, []);

  // 桌面端把侧栏「固定」后 leftWidth 会大于折叠槽宽度，此时侧栏里已经有回首页入口，
  // 浮动按钮就多余了，隐藏掉；移动端仍然一直展示。
  const showHomeFab = !isHome && (isMobile || leftWidth <= LEFT_SLOT_WIDTH);

  const contextValue = {
    blogCommonStore,
    setBlogCommonStore
  };

  return (
    <mengsBlogContext.Provider value={contextValue}>
      <div className={`layout${isHome ? " layout--home" : " layout--inner"}`}>
        <div
          className={`layout-left${leftWidth <= 20 ? " layout-left--collapsed" : " layout-left--docked"}`}
          style={{ width: leftWidth }}
        >
          {leftType === 'normal' && <LeftMarks />}
          {leftType === 'outer' && <LeftMarksForGuest />}
        </div>
        <div
          className="layout-right"
          style={{ width: `calc(100% - ${leftWidth}px)` }}
        >
          <VisitTracker />
          {children}
        </div>

        {showHomeFab && (
          <button
            type="button"
            className="home-fab"
            aria-label="回到首页"
            title="回到首页"
            onClick={() => navigate(getUrlWithMeng(searchParams, "/"))}
          >
            <span className="home-fab-icon" aria-hidden="true">🏠</span>
            <span>回到首页</span>
          </button>
        )}

      </div>
    </mengsBlogContext.Provider>
  );
};

export default Layout;
