import React from "react";
import FrontPage from "../pages/frontPage/View";
import CareerView from "../pages/career/index";
import ResumeView from "../pages/career/resume/View";
import BlogsTreeView from "../pages/career/blogsTree/View";
import BlogsWithTimeline from "../pages/career/blogsWithTimeline/View";
import PhotographyView from "../pages/photography/View";
import PhotographyIntroduction from "../pages/photography/component/Introduction";
import PhotographyPictures from "../pages/photography/component/Pictures";
import PhotographyTimeline from "../pages/photography/component/Timeline";
import PhotographyManagement from "../pages/photography/component/PhotographyManagement";
import BatchView from "../pages/photography/batchView/View";
import PhotographyForGusetView from "../pages/photographyForGuset/View"
import WritingView from "../pages/writings/View";
import EditBlogsView from "../pages/editBlogs/View";
import BlogView from "../pages/career/blogView/View";

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
    path: "/career/blogsTree",
    Component: <BlogsTreeView />,
  },
  {
    path: "/career/blogsWithTimeline",
    Component: <BlogsWithTimeline />,
  },
  {
    path: "/career/blogView/:id",
    Component: <BlogView />,
  },
  {
    path: "/photography",
    Component: <PhotographyView />,
  },
  {
    path: "/photography/introduction",
    Component: <PhotographyIntroduction />,
  },
  {
    path: "/photography/pictures",
    Component: <PhotographyPictures />,
  },
  {
    path: "/photography/timeline",
    Component: <PhotographyTimeline />,
  },
  {
    path: "/photography/management",
    Component: <PhotographyManagement />,
  },
  {
    path: "/photography/batch/:batchId",
    Component: <BatchView />,
  },
  {
    path: "/photosForU",
    Component: <PhotographyForGusetView />,
  },
  {
    path: "/writing",
    Component: <WritingView />,
  },
  {
    path: "/editblogs",
    Component: <EditBlogsView />,
  },
];

export default routes;
