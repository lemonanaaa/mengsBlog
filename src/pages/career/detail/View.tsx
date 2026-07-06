import React, { useState, useEffect } from "react";
import {
  Tabs,
  Card,
  Tag,
  Typography,
  Space,
  Spin,
  Empty,
  Row,
  Col
} from "antd";
import {
  ProjectOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from "@ant-design/icons";
import Layout from "../../common/Layout";
import { CareerController } from "../Controller";
import { CareerData } from "../Model";
import "../../../css/career/career.css";

const { Title, Text, Paragraph } = Typography;

const DetailView: React.FC = () => {
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("experience");

  useEffect(() => {
    loadCareerData();
  }, []);

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

  const currentExp = careerData.workExperiences[0];
  const expDuration = currentExp
    ? CareerController.calculateDuration(currentExp.startDate, currentExp.endDate)
    : "";

  const tabItems = [
    {
      key: "experience",
      label: (
        <span className="career-detail-tab-label">
          <TeamOutlined /> 工作经历
        </span>
      ),
      children: !currentExp ? (
        <Empty description="工作经历建设中" />
      ) : (
        <div className="experience-section">
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
                <Text type="secondary">{expDuration}</Text>
                {currentExp.isCurrent && (
                  <Tag className="career-tag-current">在职</Tag>
                )}
              </div>
            </div>

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
                      关键结果
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
                    <Tag className="career-tag-soft" key={tech}>{tech}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "projects",
      label: (
        <span className="career-detail-tab-label">
          <ProjectOutlined /> 项目经历
        </span>
      ),
      children: (
        <div className="projects-section">
          <Row gutter={[16, 16]}>
            {careerData.projects.map((project) => {
              const duration = CareerController.calculateDuration(project.startDate, project.endDate);

              return (
                <Col xs={24} key={project.id}>
                  <Card className="project-card" bordered={false}>
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
                          <Title level={5}>项目成果</Title>
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
                            <Tag className="career-tag-neutral" key={index}>
                              {highlight}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    <div className="project-tech-stack">
                      <Text strong>技术栈 </Text>
                      <Space wrap>
                        {project.techStack.map((tech) => (
                          <Tag className="career-tag-soft" key={tech}>{tech}</Tag>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="career-page career-page--detail">
        <div className="career-header career-header--detail">
          <Title level={2}>项目介绍</Title>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="career-tabs career-tabs--detail"
        />
      </div>
    </Layout>
  );
};

export default DetailView;
