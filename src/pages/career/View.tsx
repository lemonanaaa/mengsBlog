import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  Card, 
  Progress, 
  Tag, 
  Timeline,
  Typography, 
  Space, 
  Spin, 
  Empty, 
  Button,
  Row,
  Col,
  Divider
} from "antd";
import { 
  TrophyOutlined, 
  RocketOutlined, 
  BookOutlined, 
  ProjectOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  StarOutlined,
  LinkOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { CareerController } from "./Controller";
import { CareerData, Skill, SKILL_CATEGORIES } from "./Model";
import "../../css/career/career.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const CareerView: React.FC = () => {
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMeng = searchParams.get('meng') === 'true';

  useEffect(() => {
    loadCareerData();
  }, []);

  const loadCareerData = async () => {
    setLoading(true);
    try {
      const data = await CareerController.getAllCareerData();
      setCareerData(data);
    } catch (error) {
      console.error('加载Career数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="career-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </Layout>
    );
  }

  if (!careerData) {
    return (
      <Layout>
        <div className="career-empty">
          <Empty description="暂无数据" />
        </div>
      </Layout>
    );
  }

  // 渲染技能栈标签页
  const renderSkillsTab = () => {
    const groupedSkills = careerData.skills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    return (
      <div className="skills-section">
        <Title level={3}>
          <RocketOutlined /> 技术栈
        </Title>
        
        {Object.entries(groupedSkills).map(([category, skills]) => (
          <Card key={category} className="skill-category-card" bordered={false}>
            <Title level={4}>{SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]}</Title>
            <Row gutter={[16, 16]}>
              {skills.map((skill) => (
                <Col xs={24} sm={12} md={8} key={skill.name}>
                  <div className="skill-item">
                    <div className="skill-header">
                      <Text strong>{skill.name}</Text>
                      <Text type="secondary">{skill.level}%</Text>
                    </div>
                    <Progress 
                      percent={skill.level} 
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      showInfo={false}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ))}

        <Divider />

        <Title level={3}>
          <BookOutlined /> 最近在学
        </Title>
        <Row gutter={[16, 16]}>
          {careerData.learning.map((item) => (
            <Col xs={24} md={12} lg={8} key={item.name}>
              <Card 
                className="learning-card"
                hoverable
              >
                <div className="learning-header">
                  <Title level={4}>{item.name}</Title>
                  <Tag color={item.status === 'learning' ? 'blue' : 'green'}>
                    {item.status === 'learning' ? '学习中' : '已完成'}
                  </Tag>
                </div>
                <Paragraph className="learning-description">
                  {item.description}
                </Paragraph>
                {item.progress !== undefined && (
                  <div className="learning-progress">
                    <Text type="secondary">进度: {item.progress}%</Text>
                    <Progress percent={item.progress} size="small" />
                  </div>
                )}
                <Text type="secondary" className="learning-date">
                  开始时间: {CareerController.formatDate(item.startDate)}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  // 渲染工作经历标签页
  const renderExperienceTab = () => {
    return (
      <div className="experience-section">
        <Title level={3}>
          <TeamOutlined /> 工作经历
        </Title>
        
        <Timeline className="experience-timeline">
          {careerData.workExperiences.map((exp, index) => {
            const duration = CareerController.calculateDuration(exp.startDate, exp.endDate);
            
            return (
              <Timeline.Item
                key={exp.id}
                color={exp.isCurrent ? 'green' : 'blue'}
                dot={exp.isCurrent ? <TeamOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <Card className="experience-card" bordered={false}>
                  <div className="experience-header">
                    <div className="experience-title-section">
                      <Title level={4}>{exp.position}</Title>
                      <Text className="company-name">
                        <EnvironmentOutlined /> {exp.company}
                      </Text>
                    </div>
                    <div className="experience-date-section">
                      <Text strong>
                        {CareerController.formatDate(exp.startDate)} - {CareerController.formatDate(exp.endDate)}
                      </Text>
                      <br />
                      <Text type="secondary">{duration}</Text>
                      {exp.isCurrent && (
                        <Tag color="green" style={{ marginLeft: 8 }}>在职</Tag>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <div className="experience-content">
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12}>
                        <div className="experience-section-item">
                          <Title level={5}>工作职责</Title>
                          <ul>
                            {exp.responsibilities.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </Col>

                      <Col xs={24} md={12}>
                        <div className="experience-section-item">
                          <Title level={5}>
                            <TrophyOutlined /> 主要成就
                          </Title>
                          <ul className="achievements-list">
                            {exp.achievements.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    </Row>

                    <div className="experience-section-item">
                      <Title level={5}>技术栈</Title>
                      <Space wrap>
                        {exp.techStack.map((tech) => (
                          <Tag color="blue" key={tech}>{tech}</Tag>
                        ))}
                      </Space>
                    </div>
                  </div>
                </Card>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </div>
    );
  };

  // 渲染项目经历标签页
  const renderProjectsTab = () => {
    return (
      <div className="projects-section">
        <Title level={3}>
          <ProjectOutlined /> 项目经历
        </Title>
        
        <Row gutter={[16, 24]}>
          {careerData.projects.map((project) => {
            const duration = CareerController.calculateDuration(project.startDate, project.endDate);
            
            return (
              <Col xs={24} key={project.id}>
                <Card 
                  className="project-card"
                  hoverable
                >
                  <div className="project-header">
                    <div>
                      <Title level={4}>{project.name}</Title>
                      <Text type="secondary">{project.role}</Text>
                    </div>
                    <div className="project-date">
                      <CalendarOutlined />
                      <Text>
                        {CareerController.formatDate(project.startDate)} - {CareerController.formatDate(project.endDate)}
                      </Text>
                      <Text type="secondary"> ({duration})</Text>
                    </div>
                  </div>

                  <Paragraph className="project-description">
                    {project.description}
                  </Paragraph>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <div className="project-section">
                        <Title level={5}>负责内容</Title>
                        <ul>
                          {project.responsibilities.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </Col>

                    <Col xs={24} md={12}>
                      <div className="project-section">
                        <Title level={5}>
                          <TrophyOutlined /> 项目成果
                        </Title>
                        <ul className="project-achievements">
                          {project.achievements.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </Col>
                  </Row>

                  {project.highlights && project.highlights.length > 0 && (
                    <div className="project-highlights">
                      <Space wrap>
                        {project.highlights.map((highlight, index) => (
                          <Tag icon={<StarOutlined />} color="gold" key={index}>
                            {highlight}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}

                  <Divider />

                  <div className="project-tech-stack">
                    <Text strong>技术栈: </Text>
                    <Space wrap>
                      {project.techStack.map((tech) => (
                        <Tag color="purple" key={tech}>{tech}</Tag>
                      ))}
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  // 渲染精选博客标签页
  const renderBlogsTab = () => {
    if (!careerData.featuredBlogs || careerData.featuredBlogs.length === 0) {
      return (
        <div className="blogs-section">
          <Empty description="暂无精选博客" />
        </div>
      );
    }

    return (
      <div className="blogs-section">
        <Title level={3}>
          <BookOutlined /> 精选技术文章
        </Title>
        <Paragraph type="secondary">
          这里展示我最具代表性的技术博客文章，点击可查看完整内容
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {careerData.featuredBlogs.map((blog) => {
            const date = new Date(blog.createdAt).toLocaleDateString('zh-CN');
            
            return (
              <Col xs={24} md={12} key={blog._id}>
                <Card 
                  className="blog-card"
                  hoverable
                  actions={[
                    <Button 
                      type="link" 
                      icon={<LinkOutlined />}
                      onClick={() => navigate(`/career/blogView/${blog._id}${isMeng ? '?meng=true' : ''}`)}
                    >
                      阅读全文
                    </Button>
                  ]}
                >
                  <div className="blog-header">
                    <Title level={4}>{blog.title}</Title>
                    <Tag icon={<StarOutlined />} color="gold">精选</Tag>
                  </div>
                  
                  {blog.summary && (
                    <Paragraph className="blog-summary" ellipsis={{ rows: 3 }}>
                      {blog.summary}
                    </Paragraph>
                  )}

                  <div className="blog-meta">
                    <Space wrap>
                      <Text type="secondary">
                        <CalendarOutlined /> {date}
                      </Text>
                      <Text type="secondary">
                        阅读时间: {blog.readingTime} 分钟
                      </Text>
                      <Text type="secondary">
                        浏览: {blog.viewCount} 次
                      </Text>
                    </Space>
                  </div>

                  {blog.tags && blog.tags.length > 0 && (
                    <div className="blog-tags">
                      <Space wrap>
                        {blog.tags.slice(0, 5).map((tag, index) => (
                          <Tag color="blue" key={index}>{tag}</Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        <div className="view-all-blogs">
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
          >
            查看所有博客
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="career-page">
        <div className="career-header">
          <Title level={2}>职业生涯</Title>
          <Paragraph>
            前端工程师 | 技术爱好者 | 持续学习者
          </Paragraph>
        </div>

        <Tabs 
          defaultActiveKey="skills" 
          size="large"
          className="career-tabs"
        >
          <TabPane 
            tab={<span><RocketOutlined />技能栈</span>} 
            key="skills"
          >
            {renderSkillsTab()}
          </TabPane>

          <TabPane 
            tab={<span><TeamOutlined />工作经历</span>} 
            key="experience"
          >
            {renderExperienceTab()}
          </TabPane>

          <TabPane 
            tab={<span><ProjectOutlined />项目经历</span>} 
            key="projects"
          >
            {renderProjectsTab()}
          </TabPane>

          <TabPane 
            tab={<span><BookOutlined />精选博客</span>} 
            key="blogs"
          >
            {renderBlogsTab()}
          </TabPane>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CareerView;

