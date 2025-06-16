import React from "react";
import FrontPage from "../pages/frontPage/View.tsx";
import CareerView from "../pages/career/index.tsx";
import ResumeView from "../pages/career/resume/View.tsx";
import HasLearnedView from "../pages/career/hasLearned/View.tsx";
import PhotographyView from "../pages/photography/View.tsx";
import PhotographyForGusetView from "../pages/photographyForGuset/View.tsx"
import WritingView from "../pages/writings/View.tsx";

const routes = [
  {
    path: "/",
    Component: <FrontPage />,
  },
  {
    path: "/career",
    Component: <CareerView />,
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
    path: "/photosforu",
    Component: <PhotographyForGusetView />,
  },
  {
    path: "/writing",
    Component: <WritingView />,
  },
];

export default routes;
