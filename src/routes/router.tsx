import React, { Suspense } from "react";

// 懒加载组件 - 按功能模块分割
const FrontPage = React.lazy(() => import("../pages/frontPage/View"));
const CareerView = React.lazy(() => import("../pages/career/View"));
const ResumeView = React.lazy(() => import("../pages/career/resume/View"));
const CareerDetailView = React.lazy(() => import("../pages/career/detail/View"));
const BlogsTreeView = React.lazy(() => import("../pages/career/blogsTree/View"));
const BlogsWithTimeline = React.lazy(() => import("../pages/career/blogsWithTimeline/View"));
const BlogView = React.lazy(() => import("../pages/career/blogView/View"));

// 摄影模块
const PhotographyView = React.lazy(() => import("../pages/photography/View"));
const PhotographyIntroduction = React.lazy(() => import("../pages/photography/component/Introduction"));
const PhotographyPictures = React.lazy(() => import("../pages/photography/component/Pictures"));
const PhotographyTimeline = React.lazy(() => import("../pages/photography/component/Timeline"));
const PhotographyManagement = React.lazy(() => import("../pages/photography/component/PhotographyManagement"));
const PhotographyDownload = React.lazy(() => import("../pages/photography/component/DownloadView"));
const RetouchedPhotos = React.lazy(() => import("../pages/photography/batchView/RetouchedView"));
const BatchView = React.lazy(() => import("../pages/photography/batchView/View"));
const PhotographyForGusetView = React.lazy(() => import("../pages/photographyForGuset/View"));

// 写作模块
const WritingView = React.lazy(() => import("../pages/writing/View"));
const EditBlogsView = React.lazy(() => import("../pages/editBlogs/View"));

// 待办模块
const TodoView = React.lazy(() => import("../pages/todo/View"));

// 访客记录（meng）
const VisitsView = React.lazy(() => import("../pages/visits/View"));

// 加载组件
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    加载中...
  </div>
);

const routes = [
  {
    path: "/",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <FrontPage />
      </Suspense>
    ),
  },
  {
    path: "/career",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <CareerView />
      </Suspense>
    ),
  },
  {
    path: "/career/resume",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <ResumeView />
      </Suspense>
    ),
  },
  {
    path: "/career/detail",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <CareerDetailView />
      </Suspense>
    ),
  },
  {
    path: "/career/blogsTree",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <BlogsTreeView />
      </Suspense>
    ),
  },
  {
    path: "/career/blogsWithTimeline",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <BlogsWithTimeline />
      </Suspense>
    ),
  },
  {
    path: "/career/blogView/:id",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <BlogView />
      </Suspense>
    ),
  },
  {
    path: "/photography",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyView />
      </Suspense>
    ),
  },
  {
    path: "/photography/introduction",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyIntroduction />
      </Suspense>
    ),
  },
  {
    path: "/photography/pictures",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyPictures />
      </Suspense>
    ),
  },
  {
    path: "/photography/timeline",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyTimeline />
      </Suspense>
    ),
  },
  {
    path: "/photography/management",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyManagement />
      </Suspense>
    ),
  },
  {
    path: "/photography/download/:batchId",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyDownload />
      </Suspense>
    ),
  },
  {
    path: "/photography/retouched/:batchId",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <RetouchedPhotos />
      </Suspense>
    ),
  },
  {
    path: "/photography/batch/:batchId",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <BatchView />
      </Suspense>
    ),
  },
  {
    path: "/photosForU",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <PhotographyForGusetView />
      </Suspense>
    ),
  },
  {
    path: "/writing",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <WritingView />
      </Suspense>
    ),
  },
  {
    path: "/editblogs",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <EditBlogsView />
      </Suspense>
    ),
  },
  {
    path: "/todo",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <TodoView />
      </Suspense>
    ),
  },
  {
    path: "/visits",
    Component: (
      <Suspense fallback={<LoadingComponent />}>
        <VisitsView />
      </Suspense>
    ),
  },
];

export default routes;
