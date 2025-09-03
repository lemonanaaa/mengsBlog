import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Space, Input, message, Row, Col, Image, Tag, Modal, Form, DatePicker } from "antd";
import { LockOutlined, EyeOutlined, CalendarOutlined, UserOutlined, CameraOutlined, UnlockOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Password } = Input;

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  tags: string[];
  date: string;
}

interface PhotoSession {
  id: string;
  date: string;
  friendName: string;
  friendFullName: string;
  phoneTail: string; // 添加手机尾号字段
  photos: Photo[];
  password: string;
  isPublic: boolean;
}

const Pictures = () => {
  const [unlockedSessions, setUnlockedSessions] = useState<Set<string>>(new Set());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<PhotoSession | null>(null);
  const [loading, setLoading] = useState(false);

  // 模拟照片数据 - 实际应该从API获取
  const photoSessions: PhotoSession[] = [
    {
      id: "1",
      date: "2024-03-15",
      friendName: "张伟",
      friendFullName: "zhangwei",
      phoneTail: "1234", // 手机尾号
      password: "20240315zhangwei1234",
      isPublic: false,
      photos: [
        {
          id: "1-1",
          url: "/api/photos/zhangwei-spring-1.jpg",
          thumbnail: "/api/photos/zhangwei-spring-1-thumb.jpg",
          title: "春日樱花人像",
          description: "在樱花盛开的季节，捕捉春天的美好瞬间",
          tags: ["人像", "樱花", "春天"],
          date: "2024-03-15"
        },
        {
          id: "1-2",
          url: "/api/photos/zhangwei-spring-2.jpg",
          thumbnail: "/api/photos/zhangwei-spring-2-thumb.jpg",
          title: "樱花树下",
          description: "樱花飘落的美好瞬间",
          tags: ["人像", "樱花", "自然"],
          date: "2024-03-15"
        }
      ]
    },
    {
      id: "2",
      date: "2024-03-10",
      friendName: "李娜",
      friendFullName: "lina",
      phoneTail: "5678", // 手机尾号
      password: "20240310lina5678",
      isPublic: false,
      photos: [
        {
          id: "2-1",
          url: "/api/photos/lina-cafe-1.jpg",
          thumbnail: "/api/photos/lina-cafe-1-thumb.jpg",
          title: "咖啡厅人像",
          description: "温暖的咖啡厅氛围中的人像摄影",
          tags: ["人像", "咖啡厅", "温暖"],
          date: "2024-03-10"
        }
      ]
    },
    {
      id: "3",
      date: "2024-02-28",
      friendName: "王强",
      friendFullName: "wangqiang",
      phoneTail: "9999", // 手机尾号
      password: "20240228wangqiang9999",
      isPublic: false,
      photos: [
        {
          id: "3-1",
          url: "/api/photos/wangqiang-mountain-1.jpg",
          thumbnail: "/api/photos/wangqiang-mountain-1-thumb.jpg",
          title: "山间晨雾",
          description: "清晨山间的薄雾缭绕",
          tags: ["山景", "晨雾", "自然"],
          date: "2024-02-28"
        }
      ]
    }
  ];

  // 生成密码的函数 - 现在包含手机尾号
  const generatePassword = (date: string, friendFullName: string, phoneTail: string): string => {
    const dateStr = date.replace(/-/g, ''); // 移除日期中的连字符
    return dateStr + friendFullName + phoneTail;
  };

  // 点击锁图标，显示密码输入弹窗
  const handleLockClick = (session: PhotoSession) => {
    setCurrentSession(session);
    setShowPasswordModal(true);
  };

  // 验证密码
  const verifyPassword = (inputPassword: string): boolean => {
    if (!currentSession) return false;
    return currentSession.password === inputPassword;
  };

  // 处理密码验证
  const handlePasswordSubmit = (values: { password: string }) => {
    setLoading(true);
    
    setTimeout(() => {
      if (verifyPassword(values.password)) {
        setUnlockedSessions(prev => {
          prev.add(currentSession!.id);
          return new Set(prev);
        });
        setShowPasswordModal(false);
        message.success(`解锁成功！欢迎 ${currentSession?.friendName}！`);
      } else {
        message.error('密码错误，请检查拍摄日期、姓名拼写和手机尾号');
      }
      
      setLoading(false);
    }, 1000);
  };

  // 退出登录
  const handleLogout = () => {
    // setIsAuthenticated(false); // This state variable was not defined in the original file
    setCurrentSession(null);
    message.info('已退出登录');
  };

  // 检查会话是否已解锁
  const isSessionUnlocked = (sessionId: string): boolean => {
    return unlockedSessions.has(sessionId);
  };

  return (
    <div className="pictures-gallery">
      {/* 页面标题 */}
      <div className="gallery-header">
        <Title level={2}>
          <CameraOutlined /> 底片们
        </Title>
        <Text type="secondary">所有拍摄的照片集，点击锁图标输入密码查看</Text>
      </div>

      {/* 照片集展示 */}
      <div className="sessions-grid">
        <Row gutter={[24, 24]}>
          {photoSessions.map(session => (
            <Col xs={24} sm={12} lg={8} xl={6} key={session.id}>
              <Card 
                className={`session-card ${isSessionUnlocked(session.id) ? 'unlocked' : 'locked'}`}
                hoverable
              >
                {/* 锁覆盖层 */}
                {!isSessionUnlocked(session.id) && (
                  <div className="lock-overlay" onClick={() => handleLockClick(session)}>
                    <div className="lock-content">
                      <LockOutlined className="lock-icon" />
                      <Text className="lock-text">点击解锁</Text>
                      <Text className="lock-info" type="secondary">
                        {session.friendName} 的照片集
                      </Text>
                      <Text className="lock-date" type="secondary">
                        {session.date}
                      </Text>
                    </div>
                  </div>
                )}

                {/* 照片内容 */}
                <div className="session-content">
                  <div className="session-header">
                    <Title level={4}>
                      {isSessionUnlocked(session.id) ? (
                        <UnlockOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <LockOutlined />
                      )} {session.friendName} 的照片集
                    </Title>
                    <Text type="secondary">
                      <CalendarOutlined /> {session.date}
                    </Text>
                  </div>

                  {/* 照片网格 */}
                  {isSessionUnlocked(session.id) && (
                    <div className="photos-grid">
                      <Row gutter={[8, 8]}>
                        {session.photos.map(photo => (
                          <Col span={12} key={photo.id}>
                            <div className="photo-item">
                              <Image
                                alt={photo.title}
                                src={photo.thumbnail}
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                className="photo-thumbnail"
                                preview={{
                                  src: photo.url,
                                  title: photo.title
                                }}
                              />
                              <div className="photo-info">
                                <Text className="photo-title">{photo.title}</Text>
                                <div className="photo-tags">
                                  {photo.tags.map(tag => (
                                    <Tag key={tag} color="purple">
                                      {tag}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 密码输入弹窗 */}
      <Modal
        title={
          <Space>
            <LockOutlined />
            输入密码解锁照片集
          </Space>
        }
        open={showPasswordModal}
        onCancel={() => setShowPasswordModal(false)}
        footer={null}
        width={400}
      >
        {currentSession && (
          <div className="password-modal-content">
            <div className="session-info">
              <Text strong>{currentSession.friendName} 的照片集</Text>
              <br />
              <Text type="secondary">拍摄日期：{currentSession.date}</Text>
            </div>
            
            <Form onFinish={handlePasswordSubmit} className="password-form">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 12, message: '密码格式不正确' } // 增加最小长度要求
                ]}
              >
                <Password
                  placeholder="请输入密码（拍摄日期+姓名全拼+手机尾号）"
                  size="large"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  解锁照片集
                </Button>
              </Form.Item>
            </Form>

            <div className="password-help">
              <Text type="secondary">
                <CalendarOutlined /> 密码格式：拍摄日期(YYYYMMDD) + 姓名全拼 + 手机尾号
              </Text>
              <br />
              <Text type="secondary">
                例如：{generatePassword(currentSession.date, currentSession.friendFullName, currentSession.phoneTail)}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Pictures;
