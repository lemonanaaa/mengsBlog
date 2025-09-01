import React, { useState, useEffect } from "react";
import { Timeline, Card, Typography, Tag, Button, Space, Spin, Empty } from "antd";
import { CalendarOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const BlogsWithTimeline = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
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
        // 按创建时间倒序排列
        const sortedBlogs = (data.data || []).sort((a: Blog, b: Blog) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setBlogs(sortedBlogs);
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
  const deleteBlog = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/blogs/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchBlogs(); // 重新获取列表
      }
    } catch (error) {
      console.error("删除失败:", error);
    }
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
        <div style={{ padding: "24px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (blogs.length === 0) {
    return (
      <Layout>
        <div style={{ padding: "24px" }}>
          <Empty description="暂无博客内容" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div></div>
            <div>
              <Title level={2} style={{ margin: 0 }}>博客时间线</Title>
              <Text type="secondary">按时间顺序展示所有博客文章</Text>
              {isMeng && (
                <div style={{ marginTop: "8px" }}>
                  <Tag color="blue">Meng 模式</Tag>
                </div>
              )}
            </div>
            {isMeng && (
              <Button 
                type="primary" 
                onClick={() => navigate(`/editblogs?blogId=new&meng=true`)}
              >
                新建博客
              </Button>
            )}
          </div>
        </div>

        <Timeline
          mode="left"
          items={blogs.map((blog, index) => {
            const { date, time } = formatDate(blog.createdAt);
            const readTime = blog.readingTime || calculateReadTime(blog.content);

            return {
              dot: (
                <div style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(blog.status),
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 2px #d9d9d9"
                }} />
              ),
              children: (
                <Card
                  hoverable
                  style={{ marginBottom: "16px" }}
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
                        onClick={() => deleteBlog(blog._id)}
                      >
                        删除
                      </Button>
                    ] : [])
                  ]}
                >
                  <div style={{ marginBottom: "12px" }}>
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

                  <Title level={4} style={{ marginBottom: "12px" }}>
                    {blog.title}
                  </Title>

                  {blog.summary && (
                    <Paragraph
                      style={{ marginBottom: "12px", color: "#666" }}
                    >
                      {blog.summary}
                    </Paragraph>
                  )}

                  <Paragraph
                    ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                    style={{ marginBottom: "12px" }}
                  >
                    {blog.content.replace(/<[^>]*>/g, '')}
                  </Paragraph>

                  <div style={{ marginBottom: "12px" }}>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      作者: {blog.author} | 发布时间: {blog.publishedAt ? formatDate(blog.publishedAt).date : '未发布'}
                    </Text>
                  </div>

                  {blog.tags && blog.tags.length > 0 && (
                    <div>
                      {blog.tags.map((tag, tagIndex) => (
                        <Tag key={tagIndex} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </Card>
              )
            };
          })}
        />
      </div>
    </Layout>
  );
};

export default BlogsWithTimeline;
