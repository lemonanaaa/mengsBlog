import React, { useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../common/Layout";
import { mengsBlogContext } from "../common/Layout";
import { Typography, Card, Row, Col, Button, Tag } from "antd";
import { 
  CameraOutlined, 
  BookOutlined, 
  PictureOutlined, 
  ClockCircleOutlined, 
  FolderOutlined,
  CrownOutlined 
} from "@ant-design/icons";
import { createNavigateWithMeng } from "../../utils/navigation";

const { Title, Text, Paragraph } = Typography;

const Photography = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blogCommonStore } = useContext(mengsBlogContext) as any;
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  // 功能卡片数据
  const featureCards = [
    {
      icon: <BookOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      title: "摄影师介绍",
      description: "了解摄影师萌的专业背景、技能和服务项目",
      path: "/photography/introduction",
      color: "#1890ff"
    },
    {
      icon: <PictureOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
      title: "底片展示",
      description: "查看所有拍摄的照片集，支持密码解锁查看",
      path: "/photography/pictures",
      color: "#52c41a"
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
      title: "拍摄时间线",
      description: "记录每次拍摄的时间、地点、任务和设备等信息",
      path: "/photography/timeline",
      color: "#722ed1"
    }
  ];

  // meng模式下的额外功能
  if (isMeng) {
    featureCards.push({
      icon: <FolderOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />,
      title: "底片管理",
      description: "管理所有拍摄批次和照片，支持上传、删除等操作",
      path: "/photography/management",
      color: "#fa8c16"
    });
  }

  return (
    <Layout>
      <div className="photography-main">
        {/* 页面标题 */}
        <div className="photography-header">
          <Title level={1}>
            <CameraOutlined /> 摄影师萌
            {isMeng && (
              <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 16, fontSize: '16px' }}>
                meng模式
              </Tag>
            )}
          </Title>
          <Text type="secondary" style={{ fontSize: '18px' }}>
            专业人像摄影师，专注于捕捉美好瞬间
          </Text>
          {isMeng && (
            <Paragraph style={{ marginTop: 16, fontSize: '16px', color: '#722ed1' }}>
              欢迎使用meng模式！在这里你可以管理所有拍摄内容，包括查看、上传、编辑照片等。
            </Paragraph>
          )}
        </div>

        {/* 功能导航卡片 */}
        <div className="feature-cards">
          <Title level={2}>功能导航</Title>
          <Row gutter={[24, 24]}>
            {featureCards.map((card, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                <Card
                  hoverable
                  className="feature-card"
                  onClick={() => navigateWithMeng(card.path)}
                  style={{ 
                    cursor: 'pointer',
                    border: `2px solid ${card.color}`,
                    borderRadius: '12px'
                  }}
                >
                  <div className="card-content" style={{ textAlign: 'center' }}>
                    <div className="card-icon" style={{ marginBottom: '16px' }}>
                      {card.icon}
                    </div>
                    <Title level={3} style={{ color: card.color, marginBottom: '12px' }}>
                      {card.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {card.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 快速访问按钮 */}
        <div className="quick-access">
          <Title level={3}>快速访问</Title>
          <Row gutter={[16, 16]}>
            <Col>
              <Button 
                type="primary" 
                size="large"
                icon={<PictureOutlined />}
                onClick={() => navigateWithMeng('/photography/pictures')}
              >
                查看底片
              </Button>
            </Col>
            <Col>
              <Button 
                size="large"
                icon={<ClockCircleOutlined />}
                onClick={() => navigateWithMeng('/photography/timeline')}
              >
                拍摄记录
              </Button>
            </Col>
            {isMeng && (
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<FolderOutlined />}
                  onClick={() => navigateWithMeng('/photography/management')}
                  style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  底片管理
                </Button>
              </Col>
            )}
          </Row>
        </div>

        {/* 联系信息 */}
        <div className="contact-info">
          <Card style={{ marginTop: '40px', background: '#f8f9fa' }}>
            <Title level={3}>联系信息</Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <Text strong>📧 邮箱：</Text>
                <Text>lemonanaaa@163.com</Text>
              </Col>
              <Col xs={24} md={8}>
                <Text strong>📱 微信：</Text>
                <Text>xxx</Text>
              </Col>
              <Col xs={24} md={8}>
                <Text strong>📍 工作室：</Text>
                <Text>shanghai</Text>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Photography;
