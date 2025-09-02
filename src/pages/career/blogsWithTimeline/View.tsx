import React, { useState, useEffect } from "react";
import { Timeline, Card, Typography, Tag, Button, Space, Spin, Empty, Modal, message } from "antd";
import { CalendarOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import "../../../css/career/blogsTimeline.css";
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

const BlogsWithTimeline = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedBlogs, setExpandedBlogs] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 获取博客列表
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/blogs");
      if (response.ok) {
        const data = await response.json();
        // 直接使用后端返回的数据，不进行前端排序
        setBlogs(data.data || []);
      } else {
        console.error("获取博客列表失败");
      }
    } catch (error) {
      console.error("网络错误:", error);
    } finally {
      setLoading(false);
    }
  };

  // 删除博客
  const deleteBlog = async (id: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除博客《${title}》吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/blogs/${id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            message.success('博客删除成功！');
            fetchBlogs(); // 重新获取列表
          } else {
            message.error('删除失败，请稍后重试');
          }
        } catch (error) {
          console.error("删除失败:", error);
          message.error('网络错误，删除失败');
        }
      },
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
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

  // 切换博客展开/收起状态
  const toggleBlogExpansion = (blogId: string) => {
    const newExpandedBlogs = new Set(expandedBlogs);
    if (newExpandedBlogs.has(blogId)) {
      newExpandedBlogs.delete(blogId);
    } else {
      newExpandedBlogs.add(blogId);
    }
    setExpandedBlogs(newExpandedBlogs);
  };



  // 计算阅读时间（如果API没有提供）
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200; // 中文阅读速度
    const wordCount = content.replace(/<[^>]*>/g, '').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="blogs-timeline-loading">
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (blogs.length === 0) {
    return (
      <Layout>
        <div className="blogs-timeline-empty">
          <Empty description="暂无博客内容" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blogs-timeline-page">
        <div className="blogs-timeline-header">
          <div className="blogs-timeline-header-container">
            {/* 标题部分 - 始终居中 */}
            <div className="blogs-timeline-title-section">
              <Title level={2} className="blogs-timeline-title">博客时间线</Title>
              <Text type="secondary" className="blogs-timeline-subtitle">按时间顺序展示所有博客文章</Text>
              {isMeng && (
                <div className="blogs-timeline-meng-tag">
                  <Tag color="blue">Meng 模式</Tag>
                </div>
              )}
            </div>
            
            {/* 新建博客按钮 - 绝对定位在右侧 */}
            {isMeng && (
              <Button
                type="primary"
                className="blogs-timeline-new-button"
                onClick={() => navigate(`/editblogs?blogId=new&meng=true`)}
              >
                新建博客
              </Button>
            )}
          </div>
        </div>

        <div className="timeline-container">
          {blogs.map((blog, index) => {
            const { date, time } = formatDate(blog.createdAt);
            const readTime = blog.readingTime || calculateReadTime(blog.content);

            return (
              <div key={blog._id} className="timeline-row">
                {/* 左侧时间区域 */}
                <div className="timeline-time-section">
                  <div className="timeline-time-text">
                    <div>{date}</div>
                    <div className="timeline-time-detail">{time}</div>
                  </div>
                </div>

                {/* 中间时间轴区域 */}
                <div className="timeline-axis-section">
                  {/* 时间轴节点 */}
                  <div 
                    className={`timeline-dot timeline-dot--${blog.status}`}
                  />
                  
                  {/* 连接线 - 只在非最后一行显示 */}
                  {index < blogs.length - 1 && (
                    <div className="timeline-connector" />
                  )}
                </div>

                {/* 右侧内容区域 */}
                <div className="timeline-content-section">
                  <Card
                    className="timeline-card"
                    hoverable
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/career/blogView/${blog._id}${isMeng ? '?meng=true' : ''}`)}
                      >
                        查看
                      </Button>,
                      ...(isMeng ? [
                        <Button
                          key="edit"
                          type="link"
                          icon={<EditOutlined />}
                          onClick={() => navigate(`/editblogs?blogId=${blog._id}&meng=true`)}
                        >
                          编辑
                        </Button>,
                        <Button
                          key="delete"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteBlog(blog._id, blog.title)}
                        >
                          删除
                        </Button>
                      ] : [])
                    ]}
                  >
                    <div className="blog-card-tags">
                      <Space wrap>
                        <Tag color={getStatusColor(blog.status)}>
                          {getStatusText(blog.status)}
                        </Tag>
                        {blog.isFeatured && (
                          <Tag color="gold">
                            精选
                          </Tag>
                        )}
                        <Text type="secondary">
                          <CalendarOutlined /> {date} {time}
                        </Text>
                        <Text type="secondary">
                          阅读时间: {readTime} 分钟
                        </Text>
                        <Text type="secondary">
                          浏览: {blog.viewCount} 次
                        </Text>
                        {blog.category && (
                          <Tag color="purple">
                            {blog.category.name}
                          </Tag>
                        )}
                      </Space>
                    </div>

                    <Title level={4} className="blog-card-title">
                      {blog.title}
                    </Title>

                    {blog.summary && (
                      <Paragraph className="blog-card-summary">
                        {blog.summary}
                      </Paragraph>
                    )}

                    {/* 展开/收起按钮 - 固定在摘要下方，左对齐 */}
                    <div className="blog-card-expand-button">
                      <Button 
                        type="primary"
                        size="small"
                        onClick={() => toggleBlogExpansion(blog._id)}
                        style={{ 
                          padding: '4px 16px',
                          height: 'auto',
                          borderRadius: '4px'
                        }}
                      >
                        {expandedBlogs.has(blog._id) ? '收起' : '在此页阅读全文'}
                      </Button>
                    </div>

                    {/* 博客原文内容 */}
                    {expandedBlogs.has(blog._id) && (
                      <div className="blog-card-content">
                        <Paragraph className="blog-card-full-content">
                          {blog.content.replace(/<[^>]*>/g, '')}
                        </Paragraph>
                        {/* 全文后的收起按钮 */}
                        <div className="blog-card-collapse-button">
                          <Button 
                            type="default"
                            size="small"
                            onClick={() => toggleBlogExpansion(blog._id)}
                            style={{ 
                              padding: '4px 16px',
                              height: 'auto',
                              borderRadius: '4px',
                              marginTop: '16px'
                            }}
                          >
                            收起全文
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="blog-card-meta">
                      <Text type="secondary" className="blog-card-meta-text">
                        作者: {blog.author} | 发布时间: {blog.publishedAt ? formatDate(blog.publishedAt).date : '未发布'}
                      </Text>
                    </div>

                    {blog.tags && blog.tags.length > 0 && (
                      <div className="blog-card-tags-container">
                        {blog.tags.map((tag, tagIndex) => (
                          <Tag key={tagIndex} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default BlogsWithTimeline;
