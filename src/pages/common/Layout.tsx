import React from "react";
import "../../css/common/layout.css";

import LeftMarks from "./leftMarks.tsx";
import LeftMarksForGuest from "./LeftMarksForGuest.tsx"


const Layout = (props) => {
  const { children, leftType = 'normal' } = props;
  return (
    <div className="layout">
      <div className="layout-left">
        {/* 默认显示 */}
        {leftType === 'normal' && <LeftMarks />}
        {/* 对摄影客人显示 */}
        {leftType === 'outer' && <LeftMarksForGuest />}
      </div>
      <div className="layout-right">{children}</div>
    </div>
  );
};

export default Layout;
