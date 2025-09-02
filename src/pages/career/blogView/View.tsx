import React, { useState, useEffect } from "react";
import { Card, Typography, Tag, Button, Space, Spin, Empty, Divider } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";

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
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 获取博客详情
  const fetchBlog = async (blogId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/blogs/${blogId}`);
      if (response.ok) {
        const data = await response.json();
        setBlog(data.data || data);
      } else {
        console.error("获取博客详情失败");
        navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`);
      }
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
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Empty description="博客不存在或已被删除" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "24px", maxWidth: "88%", margin: "0 auto" }}>
        {/* 返回按钮 */}
        <div style={{ marginBottom: "24px" }}>
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
          <div style={{ marginBottom: "24px" }}>
            <Title level={1} style={{ marginBottom: "16px" }}>
              {blog.title}
            </Title>
            
            <Space wrap>
              <Tag color={getStatusColor(blog.status)}>
                {getStatusText(blog.status)}
              </Tag>
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
                <Tag color="blue">Meng 模式</Tag>
              )}
            </Space>
          </div>

          {/* 摘要 */}
          {blog.summary && (
            <div style={{ marginBottom: "24px" }}>
              <Paragraph style={{ 
                fontSize: "16px", 
                color: "#666", 
                fontStyle: "italic",
                borderLeft: "4px solid #1890ff",
                paddingLeft: "16px",
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px"
              }}>
                {blog.summary}
              </Paragraph>
            </div>
          )}

          <Divider />

          {/* 博客信息 */}
          <div style={{ marginBottom: "24px" }}>
            <Space wrap>
              <Text type="secondary">
                <CalendarOutlined /> 创建时间: {formatDate(blog.createdAt)}
              </Text>
              {blog.publishedAt && (
                <Text type="secondary">
                  发布时间: {formatDate(blog.publishedAt)}
                </Text>
              )}
              <Text type="secondary">
                更新时间: {formatDate(blog.updatedAt)}
              </Text>
              <Text type="secondary">
                作者: {blog.author}
              </Text>
              <Text type="secondary">
                <EyeOutlined /> 浏览: {blog.viewCount} 次
              </Text>
              <Text type="secondary">
                阅读时间: {blog.readingTime} 分钟
              </Text>
            </Space>
          </div>

          <Divider />

          {/* 博客内容 */}
          <div style={{ marginBottom: "24px" }}>
            <div 
              dangerouslySetInnerHTML={{ __html: blog.content }}
              style={{
                lineHeight: "1.8",
                fontSize: "16px",
                color: "#333"
              }}
            />
          </div>

          {/* 标签 */}
          {blog.tags && blog.tags.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <Text strong style={{ marginRight: "8px" }}>标签:</Text>
              {blog.tags.map((tag, index) => (
                <Tag key={index} color="blue" style={{ marginBottom: "8px" }}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          <Divider />

          {/* 操作按钮 */}
          <div style={{ textAlign: "center" }}>
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
