import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../common/Layout";
import { Typography, Card, Row, Col, Tag } from "antd";
import {
  CameraOutlined,
  BookOutlined,
  PictureOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  CrownOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { createNavigateWithMeng } from "../../utils/navigation";
import "../../css/photography/photographyMain.css";

const { Title, Text, Paragraph } = Typography;

const Photography = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMeng = searchParams.get("meng") === "true";
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  const featureCards = [
    {
      icon: <BookOutlined style={{ fontSize: "32px", color: "#1890ff" }} />,
      title: "介绍",
      description: "简单说说这里的照片是怎么来的",
      path: "/photography/introduction",
      color: "#1890ff",
      badge: "关于",
    },
    {
      icon: <PictureOutlined style={{ fontSize: "32px", color: "#52c41a" }} />,
      title: "底片",
      description: "按批次查看照片，部分内容需要密码",
      path: "/photography/pictures",
      color: "#52c41a",
      badge: "作品",
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: "32px", color: "#722ed1" }} />,
      title: "时间线",
      description: "按时间看看拍过什么",
      path: "/photography/timeline",
      color: "#722ed1",
      badge: "记录",
    },
  ];

  if (isMeng) {
    featureCards.push({
      icon: <FolderOutlined style={{ fontSize: "32px", color: "#fa8c16" }} />,
      title: "底片管理",
      description: "上传、编辑和管理照片批次",
      path: "/photography/management",
      color: "#fa8c16",
      badge: "管理",
    });
  }

  return (
    <Layout>
      <div className="photography-main">
        <div className="photography-header">
          <Title level={1}>
            <CameraOutlined /> 摄影 Meng
            {isMeng && (
              <Tag
                color="purple"
                icon={<CrownOutlined />}
                style={{ marginLeft: 16, fontSize: "16px" }}
              >
                meng模式
              </Tag>
            )}
          </Title>
          <Text type="secondary" style={{ fontSize: "18px" }}>
            页面建设中，正在解决大照片存储问题，敬请期待
          </Text>
          {isMeng && (
            <Paragraph className="ant-typography-caption">
              meng 模式下可以管理照片批次：查看、上传和编辑。
            </Paragraph>
          )}
        </div>

        <div className="feature-cards">
          <Title level={2}>看看这些</Title>
          <Row gutter={[24, 24]}>
            {featureCards.map((card) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={card.path}>
                <Card
                  hoverable
                  className="feature-card"
                  onClick={() => navigateWithMeng(card.path)}
                  style={{
                    cursor: "pointer",
                    border: `2px solid ${card.color}`,
                    borderRadius: "12px",
                  }}
                >
                  <div className="card-content" style={{ textAlign: "center" }}>
                    <div className="card-icon">{card.icon}</div>
                    <div style={{ marginBottom: "8px" }}>
                      <Tag
                        color={card.color}
                        style={{ fontSize: "12px", fontWeight: 500 }}
                      >
                        {card.badge}
                      </Tag>
                    </div>
                    <Title
                      level={3}
                      style={{ color: card.color, marginBottom: "8px" }}
                    >
                      {card.title}
                    </Title>
                    <Text
                      type="secondary"
                      style={{ fontSize: "14px", lineHeight: "1.5" }}
                    >
                      {card.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <div className="contact-info">
          <Card>
            <Title level={3}>联系</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <MailOutlined style={{ color: "#1890ff", fontSize: "18px", marginTop: 4 }} />
                  <div>
                    <Text strong>邮箱</Text>
                    <br />
                    <Text>lemonanaaa@163.com</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <EnvironmentOutlined
                    style={{ color: "#722ed1", fontSize: "18px", marginTop: 4 }}
                  />
                  <div>
                    <Text strong>城市</Text>
                    <br />
                    <Text>上海</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Photography;
