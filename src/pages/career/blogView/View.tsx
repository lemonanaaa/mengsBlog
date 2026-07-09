import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, Typography, Tag, Button, Space, Spin, Empty, Divider } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, EyeOutlined, EditOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { ClockCircleOutlined, SyncOutlined, UserOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { blogApiRequest } from "../../../config/api";

// 阅读体验组件
import { ReaderPreferencesProvider } from "./ReaderPreferencesProvider";
import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderLayout } from "./ReaderLayout";
import { BlogContentRenderer } from "./BlogContentRenderer";
import { ReadingProgressBar } from "./ReadingProgressBar";
import { TocPanel } from "./TocPanel";
import { ColorIndexPanel } from "./ColorIndexPanel";
import { BackToTopButton } from "./BackToTopButton";
import { LastReadTracker } from "./LastReadTracker";
import { useToc } from "./useToc";
import { useColorIndex } from "./useColorIndex";
import { useLastReadPosition } from "./useLastReadPosition";

// CSS
import "../../../css/career/blogView.css";
import "../../../css/career/blogView/themes.css";
import "../../../css/career/blogView/codeHighlight.css";
import "../../../css/career/blogView/tocPanel.css";
import "../../../css/career/blogView/readingProgressBar.css";
import "../../../css/career/blogView/readerToolbar.css";
import "../../../css/career/blogView/backToTopButton.css";
import "../../../css/career/blogView/headingAnchor.css";
import "../../../css/career/blogView/colorIndex.css";

const { Title, Text, Paragraph } = Typography;

interface Blog {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  status: string;
  viewCount: number;
  author: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  isFeatured: boolean;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const BlogView = () => {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const hasFetchedRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const isMeng = searchParams.get('meng') === 'true';

  // TOC
  const { entries, activeId } = useToc(bodyRef, blog?.content ?? '');
  const hasToc = entries.length > 0;

  // 颜色重点索引
  const colorIndex = useColorIndex(bodyRef, blog?.content ?? '');
  const hasColors = colorIndex.colors.length > 0;

  // 上次阅读位置
  const { record, saveRecord } = useLastReadPosition(blog?._id ?? '');

  const handleContentReady = useCallback(() => {
    setContentReady(true);
  }, []);

  // 点击返回顶部时清除阅读位置
  const handleScrollTop = useCallback(() => {
    saveRecord({ headingId: null, scrollPercent: 0 });
  }, [saveRecord]);

  // 获取博客详情
  const fetchBlog = async (blogId: string) => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoading(true);
    try {
      const data = await blogApiRequest(`/blogs/${blogId}`);
      setBlog(data.data || data);
    } catch (error) {
      console.error("网络错误:", error);
      navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'gray';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'archived': return '已归档';
      default: return '未知';
    }
  };

  useEffect(() => {
    if (id) {
      fetchBlog(id);
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container" style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="empty-container" style={{ padding: 24 }}>
          <Empty description="博客不存在或已被删除" />
        </div>
      </Layout>
    );
  }

  // 博客头部信息区域
  const blogHeader = (
    <div className="blog-header-section">
      {/* 返回按钮 */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
        >
          返回列表
        </Button>
      </div>

      {/* 标题和状态 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={1}>{blog.title}</Title>
        <Space wrap>
          {isMeng && (
            <Tag color={getStatusColor(blog.status)}>{getStatusText(blog.status)}</Tag>
          )}
          {blog.category && <Tag color="purple">{blog.category.name}</Tag>}
          {blog.isFeatured && <Tag color="gold">精选</Tag>}
          {isMeng && <Tag color="purple" icon={<CrownOutlined />}>meng模式</Tag>}
        </Space>
      </div>

      {/* 摘要 */}
      {blog.summary && (
        <div style={{ marginBottom: 24 }}>
          <Paragraph style={{
            fontSize: 16, color: '#666', fontStyle: 'italic',
            borderLeft: '4px solid var(--accent, #1890ff)',
            padding: 16, backgroundColor: 'var(--bg-secondary, #f5f5f5)', borderRadius: 4
          }}>
            {blog.summary}
          </Paragraph>
        </div>
      )}

      {/* 标签 */}
      {blog.tags && blog.tags.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ marginRight: 8 }}>标签:</Text>
          {blog.tags.map((tag, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 8 }}>{tag}</Tag>
          ))}
        </div>
      )}

      {/* 博客信息 */}
      <div style={{
        padding: 20, backgroundColor: 'var(--bg-secondary, #fafafa)',
        borderRadius: 8, border: '1px solid var(--border, #f0f0f0)', marginBottom: 24
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <span><UserOutlined /> 作者: {blog.author}</span>
          <span><CalendarOutlined /> 创建: {formatDate(blog.createdAt)}</span>
          <span><SyncOutlined /> 更新: {formatDate(blog.updatedAt)}</span>
          <span><EyeOutlined /> 浏览: {blog.viewCount} 次</span>
          <span><FieldTimeOutlined /> 阅读: {blog.readingTime} 分钟</span>
        </div>
      </div>
    </div>
  );

  // 中栏内容
  const centerContent = (
    <>
      <BlogContentRenderer
        content={blog.content}
        bodyRef={bodyRef}
        onContentReady={handleContentReady}
      />
      <Divider />
      {/* 操作按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Space>
          {isMeng && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/editblogs?blogId=${blog._id}&meng=true`)}
            >
              编辑博客
            </Button>
          )}
          <Button onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}>
            返回列表
          </Button>
        </Space>
      </div>
    </>
  );

  // 左栏：目录导航 + 颜色重点索引
  const hasLeft = hasToc || hasColors;
  const leftPanel = (
    <>
      {hasToc && <TocPanel entries={entries} activeId={activeId} />}
      {hasColors && (
        <ColorIndexPanel
          colors={colorIndex.colors}
          activeKey={colorIndex.activeKey}
          selectColor={colorIndex.selectColor}
          position={colorIndex.position}
          total={colorIndex.total}
          next={colorIndex.next}
          prev={colorIndex.prev}
        />
      )}
    </>
  );

  return (
    <Layout>
      <ReaderPreferencesProvider>
        <ReadingProgressBar />
        <ReaderToolbar />
        <ReaderLayout
          left={hasLeft ? leftPanel : undefined}
          center={
            <>
              {blogHeader}
              {centerContent}
            </>
          }
          hasToc={hasLeft}
        />
        <BackToTopButton onScrollTop={handleScrollTop} />
        {blog._id && (
          <LastReadTracker
            blogId={blog._id}
            contentReady={contentReady}
            activeId={activeId}
            record={record}
            saveRecord={saveRecord}
          />
        )}
      </ReaderPreferencesProvider>
    </Layout>
  );
};

export default BlogView;
