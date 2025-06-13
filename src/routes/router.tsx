import React from "react";
import FrontPage from "../pages/frontPage/View.tsx";
import ResumeView from "../pages/career/resume/View.tsx";

const routes = [
  {
    path: "/",
    Component: <FrontPage />,
  },
  {
    path: "/resume",
    Component: <ResumeView />,
  },
];

export default routes;
