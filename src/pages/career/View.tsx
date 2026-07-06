import React from "react";
import { Card, Typography, Row, Col, Space, Tag } from "antd";
import {
  ProfileOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  BookOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";
import "../../css/career/career.css";

const { Title, Paragraph, Text } = Typography;

const CareerView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  const guideCards = [
    {
      key: "resume",
      icon: <ProfileOutlined style={{ fontSize: 28 }} />,
      title: "简历",
      desc: "查看完整的工作经历、项目背景与成果指标，适合投递或面试前快速了解。",
      path: "/career/resume",
      badge: "必看",
      color: "blue",
    },
    {
      key: "detail",
      icon: <ProjectOutlined style={{ fontSize: 28 }} />,
      title: "项目介绍",
      desc: "查看完整的技能、工作经历、项目经历与技术内容，支持 Tab 导航与滚动浏览。",
      path: "/career/detail",
      badge: "详细版",
      color: "purple",
    },
    {
      key: "tree",
      icon: <ApartmentOutlined style={{ fontSize: 28 }} />,
      title: "知识树",
      desc: "按主题整理能力地图，快速了解我在业务、工程化和稳定性方向的知识结构。",
      path: "/career/blogsTree",
      badge: "结构化",
      color: "cyan",
    },
    {
      key: "timeline",
      icon: <BookOutlined style={{ fontSize: 28 }} />,
      title: "博客",
      desc: "按时间查看输出内容与实践记录，当前持续建设中。",
      path: "/career/blogsWithTimeline",
      badge: "持续更新",
      color: "green",
    },
  ];

  return (
    <Layout>
      <div className="career-page">
        <div className="career-guide-header">
          <Text className="career-guide-kicker">Frontend Portfolio</Text>
          <Title level={2}>
            <CompassOutlined /> 前端 Meng 导览
          </Title>
          <Paragraph>
            先看方向，再看细节：这个页面用于快速浏览入口，帮助你在 3 分钟内了解我的内容结构。
          </Paragraph>
          <Paragraph className="career-guide-subtitle">
            适合初次访问；若要深入了解项目与经历，请点击下方卡片进入详细页。
          </Paragraph>
          <Space wrap>
            <Tag color="blue">外层导览</Tag>
            <Tag color="purple">内层详情</Tag>
            <Tag color="green">持续更新</Tag>
          </Space>
        </div>

        <Row gutter={[20, 20]}>
          {guideCards.map((card) => (
            <Col xs={24} md={12} key={card.key}>
              <Card
                hoverable
                className="career-guide-card"
                onClick={() => navigateWithMeng(card.path)}
              >
                <div className="career-guide-card-header">
                  <span className="career-guide-icon">{card.icon}</span>
                  <Tag color={card.color}>{card.badge}</Tag>
                </div>
                <Title level={4} className="career-guide-card-title">{card.title}</Title>
                <Text type="secondary" className="career-guide-card-desc">{card.desc}</Text>
                <div className="career-guide-card-action">点击进入</div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Layout>
  );
};

export default CareerView;

