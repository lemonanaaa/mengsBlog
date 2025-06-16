import React, { createContext, useState } from "react";
import "../../css/common/layout.css";

import LeftMarks from "./leftMarks.tsx";
import LeftMarksForGuest from "./LeftMarksForGuest.tsx"

export const mengsBlogContext = createContext({});

const Layout = (props) => {
  const { children, leftType = 'normal' } = props;
  const [blogCommonStore, setBlogCommonStore] = useState({})

  // 将状态和更新方法一起放入context value
  const contextValue = {
    blogCommonStore,
    setBlogCommonStore
  };

  return (
    <mengsBlogContext.Provider value={contextValue}>
      <div className="layout">
        <div className="layout-left">
          {/* 默认显示 */}
          {leftType === 'normal' && <LeftMarks />}
          {/* 对摄影客人显示 */}
          {leftType === 'outer' && <LeftMarksForGuest />}
        </div>
        <div className="layout-right">{children}</div>
      </div>
    </mengsBlogContext.Provider>
  );
};

export default Layout;
