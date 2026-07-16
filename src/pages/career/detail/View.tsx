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
  TeamOutlined,
  ExperimentOutlined
} from "@ant-design/icons";
import Layout from "../../common/Layout";
import { CareerController } from "../Controller";
import { CareerData } from "../Model";
import PracticesView from "./practices/PracticesView";
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
        <article className="detail-experience">
          <header className="detail-experience-head">
            <div>
              <h3 className="detail-experience-title">{currentExp.position}</h3>
              <p className="detail-experience-company">{currentExp.company}</p>
            </div>
            <p className="detail-experience-meta">
              {CareerController.formatDate(currentExp.startDate)} - {CareerController.formatDate(currentExp.endDate)}
              <span className="detail-experience-meta-sep"> · </span>
              {expDuration}
              {currentExp.isCurrent && (
                <>
                  <span className="detail-experience-meta-sep"> · </span>
                  <span className="detail-experience-status">在职</span>
                </>
              )}
            </p>
          </header>

          <section className="detail-experience-block">
            <h4>业务职责</h4>
            <ul>
              {currentExp.responsibilities.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="detail-experience-block">
            <h4>技术改革 & 产出</h4>
            <ul>
              {currentExp.achievements.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="detail-experience-block detail-experience-block-last">
            <h4>技术关键词</h4>
            <div className="detail-experience-tags">
              {currentExp.techStack.map((tech) => (
                <span className="detail-experience-tag" key={tech}>{tech}</span>
              ))}
            </div>
          </section>
        </article>
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
            {careerData.projects.map((project) => (
                <Col xs={24} key={project.id}>
                  <Card className="project-card" bordered={false}>
                    <div className="project-header">
                      <div>
                        <Title level={4}>{project.name}</Title>
                        <Text type="secondary">{project.role}</Text>
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
              ))}
          </Row>
        </div>
      ),
    },
    {
      key: "practices",
      label: (
        <span className="career-detail-tab-label">
          <ExperimentOutlined /> 工程实践
        </span>
      ),
      children: <PracticesView />,
    },
  ];

  return (
    <Layout>
      <div className="career-page career-page--detail">
        <div className="career-header career-header--detail">
          <Title level={2}>工作介绍</Title>
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
