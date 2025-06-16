import React from "react";
import FrontPage from "../pages/frontPage/View.tsx";
import CareerView from "../pages/career/index.tsx";
import ResumeView from "../pages/career/resume/View.tsx";
import BlogsTreeView from "../pages/career/blogsTree/View.tsx";
import BlogsWithTimeline from "../pages/career/blogsWithTimeline/View.tsx";
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
    path: "/career/blogstree",
    Component: <BlogsTreeView />,
  },
  {
    path: "/career/blogswithtimeline",
    Component: <BlogsWithTimeline />,
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
