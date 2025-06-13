import React from "react";
import LeftMarks from "./leftMarks.tsx";
import "../../css/common/layout.css";

const Layout = (props) => {
  const { children, styleList = [] } = props;
  return (
    <div className="layout">
      <LeftMarks />
      <div>{children}</div>
    </div>
  );
};

export default Layout;
