import React, { createContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../css/common/layout.css";

import LeftMarks, { LeftMarksStorage } from "./leftMarks";
import LeftMarksForGuest from "./LeftMarksForGuest"

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
  const isHome = location.pathname === "/";
  const [blogCommonStore, setBlogCommonStore] = useState({})
  const [leftWidth, setLeftWidth] = useState(getInitialLeftWidth);

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
          {children}
        </div>

      </div>
    </mengsBlogContext.Provider>
  );
};

export default Layout;
