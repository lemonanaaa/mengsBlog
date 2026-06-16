import React, { useState, useEffect, useRef } from "react";
import {
  Tabs,
  Card,
  Tag,
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
import Layout from "../../common/Layout";
import { CareerController } from "../Controller";
import { CareerData, Skill, SKILL_CATEGORIES } from "../Model";
import "../../../css/career/career.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
type SectionKey = "skills" | "experience" | "projects" | "blogs";

const DetailView: React.FC = () => {
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>("skills");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMeng = searchParams.get("meng") === "true";
  const skillsRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogsRef = useRef<HTMLDivElement>(null);
  const autoSyncPausedUntil = useRef(0);
  const sectionRefs = useRef<Array<{ key: SectionKey; ref: React.RefObject<HTMLDivElement> }>>([
    { key: "skills", ref: skillsRef },
    { key: "experience", ref: experienceRef },
    { key: "projects", ref: projectsRef },
    { key: "blogs", ref: blogsRef }
  ]);

  useEffect(() => {
    loadCareerData();
  }, []);

  useEffect(() => {
    if (loading || !careerData) return;

    let ticking = false;
    const topOffset = 120;

    const updateActiveSectionByScroll = () => {
      if (Date.now() < autoSyncPausedUntil.current) {
        ticking = false;
        return;
      }

      let current: SectionKey = "skills";
      sectionRefs.current.forEach(({ key, ref }) => {
        if (!ref.current) return;
        const top = ref.current.getBoundingClientRect().top;
        if (top <= topOffset) {
          current = key;
        }
      });
      setActiveSection(current);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateActiveSectionByScroll);
      }
    };

    updateActiveSectionByScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, careerData]);

  const loadCareerData = async () => {
    setLoading(true);
    try {
      const data = await CareerController.getAllCareerData();
      setCareerData(data);
    } catch (error) {
      console.error("加载Career数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    const target = key as SectionKey;
    setActiveSection(target);
    autoSyncPausedUntil.current = Date.now() + 900;
    const refMap: Record<SectionKey, React.RefObject<HTMLDivElement>> = {
      skills: skillsRef,
      experience: experienceRef,
      projects: projectsRef,
      blogs: blogsRef
    };
    refMap[target].current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
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

  const renderSkillsTab = () => {
    const capabilityHighlights = [
      "复杂业务交付：长期负责核心订单系统改造，能在复杂规则下稳定推进上线。",
      "工程化建设：持续推动流水线门禁、覆盖率治理与测试工具化，提升团队交付质量。",
      "跨端复用：沉淀 Pure-Model 等可复用逻辑，支持 PC / H5 场景共享核心能力。",
      "稳定性与性能：结合监控数据持续优化性能与可用性，通过灰度机制降低发布风险。"
    ];

    const focusAreas = [
      "业务架构与领域建模",
      "前端工程化与质量门禁",
      "性能优化与稳定性治理",
      "跨团队协作与技术落地",
      "技术方案文档化与沉淀"
    ];

    return (
      <div className="skills-section">
        <Title level={3}>
          <RocketOutlined /> 能力概览
        </Title>
        <Paragraph type="secondary" className="skills-intro">
          这里不再展示“技能打分”，而是聚焦你在真实业务中能够持续产出的能力。
        </Paragraph>

        <Card className="capability-summary-card" bordered={false}>
          <Title level={3}>
            <TrophyOutlined /> 核心能力亮点
          </Title>
          <ul>
            {capabilityHighlights.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Card>

        <Divider />

        <Title level={3}>
          <BookOutlined /> 重点关注方向
        </Title>
        <Space wrap>
          {focusAreas.map((item) => (
            <Tag key={item} color="blue">{item}</Tag>
          ))}
        </Space>
      </div>
    );
  };

  const renderExperienceTab = () => {
    const currentExp = careerData.workExperiences[0];
    if (!currentExp) {
      return <Empty description="工作经历建设中" />;
    }

    const duration = CareerController.calculateDuration(currentExp.startDate, currentExp.endDate);

    return (
      <div className="experience-section">
        <Title level={3}>
          <TeamOutlined /> 工作经历
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          概览仅保留当前岗位的核心信息，详细版本请查看「简历页面」。
        </Paragraph>

        <Card className="experience-card" bordered={false}>
          <div className="experience-header">
            <div className="experience-title-section">
              <Title level={4}>{currentExp.position}</Title>
              <Text className="company-name">
                <EnvironmentOutlined /> {currentExp.company}
              </Text>
            </div>
            <div className="experience-date-section">
              <Text strong>
                {CareerController.formatDate(currentExp.startDate)} - {CareerController.formatDate(currentExp.endDate)}
              </Text>
              <br />
              <Text type="secondary">{duration}</Text>
              {currentExp.isCurrent && (
                <Tag color="green" style={{ marginLeft: 8 }}>在职</Tag>
              )}
            </div>
          </div>

          <Divider />

          <div className="experience-content">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="experience-section-item">
                  <Title level={5}>核心职责</Title>
                  <ul>
                    {currentExp.responsibilities.slice(0, 2).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div className="experience-section-item">
                  <Title level={5}>
                    <TrophyOutlined /> 关键结果
                  </Title>
                  <ul className="achievements-list">
                    {currentExp.achievements.slice(0, 2).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Col>
            </Row>

            <div className="experience-section-item">
              <Title level={5}>技术关键词</Title>
              <Space wrap>
                {currentExp.techStack.slice(0, 6).map((tech) => (
                  <Tag color="blue" key={tech}>{tech}</Tag>
                ))}
              </Space>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderProjectsTab = () => {
    return (
      <div className="projects-section">
        <Title level={3}>
          <ProjectOutlined /> 项目经历
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          这里展示完整项目内容；如需按面试视角查看更完整叙述，可进入「简历页面」。
        </Paragraph>

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

  const renderBlogsTab = () => {
    if (!careerData.featuredBlogs || careerData.featuredBlogs.length === 0) {
      return (
        <div className="blogs-section">
          <Empty
            description="精选博客建设中，正在整理高质量内容，敬请期待。"
          />
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
            const date = new Date(blog.createdAt).toLocaleDateString("zh-CN");

            return (
              <Col xs={24} md={12} key={blog._id}>
                <Card
                  className="blog-card"
                  hoverable
                  actions={[
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      onClick={() => navigate(`/career/blogView/${blog._id}${isMeng ? "?meng=true" : ""}`)}
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
            onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? "?meng=true" : ""}`)}
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
          <Title level={2}>前端详情页</Title>
          <Paragraph>
            这里保留完整的技能、工作经历、项目经历与技术输出，支持 Tab 导航和滚动浏览。
          </Paragraph>
        </div>

        <Tabs
          activeKey={activeSection}
          onChange={handleTabChange}
          size="large"
          className="career-tabs"
        >
          <TabPane
            tab={<span><RocketOutlined />能力概览</span>}
            key="skills"
          />

          <TabPane
            tab={<span><TeamOutlined />工作经历</span>}
            key="experience"
          />

          <TabPane
            tab={<span><ProjectOutlined />项目经历</span>}
            key="projects"
          />

          <TabPane
            tab={<span><BookOutlined />精选博客</span>}
            key="blogs"
          />
        </Tabs>

        <div id="skills" ref={skillsRef} className="career-section-block" style={{ scrollMarginTop: 88 }}>
          {renderSkillsTab()}
        </div>
        <div id="experience" ref={experienceRef} className="career-section-block with-divider" style={{ scrollMarginTop: 88 }}>
          {renderExperienceTab()}
        </div>
        <div id="projects" ref={projectsRef} className="career-section-block with-divider" style={{ scrollMarginTop: 88 }}>
          {renderProjectsTab()}
        </div>
        <div id="blogs" ref={blogsRef} className="career-section-block with-divider" style={{ scrollMarginTop: 88 }}>
          {renderBlogsTab()}
        </div>
      </div>
    </Layout>
  );
};

export default DetailView;
