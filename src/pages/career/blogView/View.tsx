import React, { useState, useEffect, useRef } from "react";
import { Card, Typography, Tag, Button, Space, Spin, Empty, Divider } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, EyeOutlined, EditOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { ClockCircleOutlined, SyncOutlined, UserOutlined, FieldTimeOutlined } from "@ant-design/icons";
import "../../../css/career/blogView.css";
import { blogApiRequest } from "../../../config/api";

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
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 获取博客详情
  const fetchBlog = async (blogId: string) => {
    // 防止重复调用
    if (hasFetchedRef.current) {
      return;
    }
    
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'gray';
      default: return 'blue';
    }
  };

  // 获取状态文本
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
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="empty-container">
          <Empty description="博客不存在或已被删除" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blog-view-page">
        {/* 返回按钮 */}
        <div className="back-button-container">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
          >
            返回列表
          </Button>
        </div>

        {/* 博客详情卡片 */}
        <Card>
          {/* 标题和状态 */}
          <div className="title-status-section">
            <Title level={1} className="blog-title">
              {blog.title}
            </Title>

            <Space wrap>
              {/* 只在meng模式下显示状态标签 */}
              {isMeng && (
                <Tag color={getStatusColor(blog.status)}>
                  {getStatusText(blog.status)}
                </Tag>
              )}
              {blog.category && (
                <Tag color="purple">
                  {blog.category.name}
                </Tag>
              )}
              {blog.isFeatured && (
                <Tag color="gold">
                  精选
                </Tag>
              )}
              {isMeng && (
                <Tag color="purple" icon={<CrownOutlined />}>meng模式</Tag>
              )}
            </Space>
          </div>

          {/* 摘要 */}
          {blog.summary && (
            <div className="summary-section">
              <Paragraph className="summary-paragraph">
                {blog.summary}
              </Paragraph>
            </div>
          )}


          {/* 标签 */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="tags-section">
              <Text strong className="tags-label">标签:</Text>
              {blog.tags.map((tag, index) => (
                <Tag key={index} color="blue" className="tag-item">
                  {tag}
                </Tag>
              ))}
            </div>
          )}
          <Divider />

          {/* 博客信息 */}
          <div className="blog-info-section">
            <div className="blog-info-container">
              {/* 博客信息：作者、创建时间、更新时间、浏览次数、阅读时间 */}
              <div className="blog-info-row">
                <div className="info-item">
                  <UserOutlined className="info-icon" />
                  <Text type="secondary" className="info-text">
                    作者: {blog.author}
                  </Text>
                </div>
                <div className="info-item">
                  <CalendarOutlined className="info-icon" />
                  <Text type="secondary" className="info-text">
                    创建时间: {formatDate(blog.createdAt)}
                  </Text>
                </div>
                <div className="info-item">
                  <SyncOutlined className="info-icon" />
                  <Text type="secondary" className="info-text">
                    更新时间: {formatDate(blog.updatedAt)}
                  </Text>
                </div>
                <div className="info-item">
                  <EyeOutlined className="info-icon" />
                  <Text type="secondary" className="info-text">
                    浏览: {blog.viewCount} 次
                  </Text>
                </div>
                <div className="info-item">
                  <FieldTimeOutlined className="info-icon" />
                  <Text type="secondary" className="info-text">
                    阅读时间: {blog.readingTime} 分钟
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* 博客内容 */}
          <div className="blog-content-section">
            <div
              dangerouslySetInnerHTML={{ __html: blog.content }}
              className="blog-content"
            />
          </div>


          <Divider />

          {/* 操作按钮 */}
          <div className="action-buttons-section">
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
              <Button
                onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
              >
                返回列表
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BlogView;
