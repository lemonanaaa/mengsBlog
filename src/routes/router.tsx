import React from "react";
import FrontPage from "../pages/frontPage/View.tsx";
import ResumeView from "../pages/career/resume/View.tsx";
import HasLearnedView from "../pages/career/hasLearned/View.tsx";
import PhotographyView from "../pages/photography/View.tsx";
import WritingView from "../pages/writings/View.tsx";

const routes = [
  {
    path: "/",
    Component: <FrontPage />,
  },
  {
    path: "/career/resume",
    Component: <ResumeView />,
  },
  {
    path: "/career/haslearned",
    Component: <HasLearnedView />,
  },
  {
    path: "/photography",
    Component: <PhotographyView />,
  },
  {
    path: "/writing",
    Component: <WritingView />,
  },
];

export default routes;
