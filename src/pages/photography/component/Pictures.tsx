import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import { mengsBlogContext } from "../../common/Layout";
import { Card, Typography, Button, Space, Input, message, Row, Col, Image, Tag, Modal, Form, DatePicker, Spin } from "antd";
import { LockOutlined, EyeOutlined, CalendarOutlined, UserOutlined, CameraOutlined, UnlockOutlined, CrownOutlined, PictureOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { PhotographyController } from "../Controller";
import { PhotoSession } from "../Model";
import "../../../css/photography/uploadPhotos.css";

const { Title, Text, Paragraph } = Typography;
const { Password } = Input;


const Pictures = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blogCommonStore } = useContext(mengsBlogContext) as any;

  // 从localStorage恢复解锁状态
  const [unlockedSessions, setUnlockedSessions] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('unlockedSessions');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('恢复解锁状态失败:', error);
      return new Set();
    }
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<PhotoSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 保存解锁状态到localStorage
  const saveUnlockedSessions = (sessions: Set<string>) => {
    try {
      localStorage.setItem('unlockedSessions', JSON.stringify(Array.from(sessions)));
    } catch (error) {
      console.error('保存解锁状态失败:', error);
    }
  };

  // 获取所有照片批次数据
  useEffect(() => {
    fetchPhotoSessions();
  }, []);


  // 获取照片批次数据
  const fetchPhotoSessions = async () => {
    setSessionsLoading(true);
    try {
      const sessions = await PhotographyController.getAllPhotoSessions();
      setPhotoSessions(sessions);
    } catch (error) {
      console.error('获取照片批次失败:', error);
      message.error('获取照片批次失败，请稍后重试');
    } finally {
      setSessionsLoading(false);
    }
  };


  // 生成密码的函数 - 修改为名字全拼+尾号
  const generatePassword = (friendFullName: string, phoneTail: string): string => {
    return friendFullName + phoneTail;
  };

  // 点击锁图标，显示密码输入弹窗
  const handleLockClick = (session: PhotoSession) => {
    setCurrentSession(session);
    setShowPasswordModal(true);
  };

  // 验证密码 - 前端自己掌握密码校验
  const verifyPassword = (inputPassword: string): boolean => {
    if (!currentSession) return false;
    // 使用名字全拼+尾号作为密码
    const expectedPassword = generatePassword(currentSession.friendFullName, currentSession.phoneTail);
    return expectedPassword === inputPassword;
  };

  // 处理密码验证
  const handlePasswordSubmit = async (values: { password: string }) => {
    setLoading(true);

    try {
      if (verifyPassword(values.password)) {
        // 解锁成功，标记为已解锁
        const newUnlockedSessions = new Set(unlockedSessions);
        newUnlockedSessions.add(currentSession!.id);
        setUnlockedSessions(newUnlockedSessions);
        saveUnlockedSessions(newUnlockedSessions);

        setShowPasswordModal(false);
        message.success(`解锁成功！欢迎 ${currentSession?.friendName}！`);

        // 解锁成功后直接跳转到下载页面，保持meng参数
        const mengParam = isMeng ? '?meng=true' : '';
        navigate(`/photography/download/${currentSession!.id}${mengParam}`);
      } else {
        message.error('密码错误，请检查姓名全拼和手机尾号');
      }
    } catch (error) {
      console.error('解锁失败:', error);
      message.error('解锁失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };


  // 检查会话是否已解锁
  const isSessionUnlocked = (sessionId: string): boolean => {
    // meng模式下所有会话都自动解锁
    if (isMeng) {
      return true;
    }
    return unlockedSessions.has(sessionId);
  };

  // 处理点击 card 跳转到下载页面
  const handleCardClick = (session: PhotoSession) => {
    if (isSessionUnlocked(session.id)) {
      // 跳转到下载页面，保持 meng 参数
      const mengParam = isMeng ? '?meng=true' : '';
      navigate(`/photography/download/${session.id}${mengParam}`);
    } else {
      // 如果未解锁，显示密码输入弹窗
      handleLockClick(session);
    }
  };

  return (
    <Layout>
      <div className="pictures-gallery photo-management">
        {/* 页面标题 */}
        <div className="page-header">
          <Title level={2}>
            <PictureOutlined /> 底片们
          </Title>
          <Text type="secondary" style={{ fontSize: '16px', marginTop: '8px', display: 'block' }}>
            {isMeng
              ? "meng模式下可直接查看所有照片集"
              : "输入密码验证查看底片"
            }
          </Text>
          {isMeng && (
            <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 12 }}>
              meng模式
            </Tag>
          )}
        </div>

        {/* 照片集展示 */}
        <div className="sessions-grid">
          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#666' }}>正在加载照片集...</div>
            </div>
          ) : photoSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              <PictureOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>暂无照片集</div>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {photoSessions.map(session => (
                <Col xs={24} sm={12} lg={8} xl={6} key={session.id}>
                  <Card
                    className={`session-card ${isSessionUnlocked(session.id) ? 'unlocked' : 'locked'}`}
                    hoverable
                    onClick={() => handleCardClick(session)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* 锁覆盖层 - meng模式下不显示 */}
                    {!isMeng && !isSessionUnlocked(session.id) && (
                      <div className="pictures-lock-overlay" onClick={() => handleLockClick(session)}>
                        <div className="pictures-lock-content">
                          <LockOutlined className="pictures-lock-icon" />
                          <Text className="pictures-lock-text">点击解锁</Text>
                          <div className="pictures-lock-info">
                            <div style={{ marginBottom: '8px' }}>
                              <Text className="pictures-lock-friend-name" style={{ fontSize: '18px', fontWeight: 'bold', display: 'block' }}>
                                {session.batchName || '未命名批次'}
                              </Text>
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                              <Text className="pictures-lock-date" style={{ fontSize: '14px', display: 'block' }}>
                                📅 {new Date(session.date).toLocaleDateString('zh-CN')}
                              </Text>
                            </div>
                            {session.location && (
                              <div>
                                <Text className="pictures-lock-location" style={{ fontSize: '14px', display: 'block' }}>
                                  📍 {session.location}
                                </Text>
                              </div>
                            )}
                          </div>
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
                          )} {session.batchName}
                          {isMeng && (
                            <Tag color="green" style={{ marginLeft: 8, fontSize: '12px' }}>
                              已解锁
                            </Tag>
                          )}
                        </Title>

                        <div className="session-info">
                          <div className="info-item">
                            <Text type="secondary">
                              <CalendarOutlined style={{ color: '#1890ff' }} /> 拍摄时间：{new Date(session.date).toLocaleDateString('zh-CN')}
                            </Text>
                          </div>

                          {session.location && (
                            <div className="info-item">
                              <Text type="secondary">
                                <EnvironmentOutlined style={{ color: '#52c41a' }} /> 拍摄地点：{session.location}
                              </Text>
                            </div>
                          )}

                          <div className="info-item">
                            <Text type="secondary">
                              <PictureOutlined style={{ color: '#722ed1' }} /> 底片数量：{session.totalPhotos || session.photos?.length || 0} 张
                            </Text>
                          </div>
                        </div>
                      </div>

                      {/* 照片网格 - 暂时不显示照片内容 */}
                      {isSessionUnlocked(session.id) && session.photos && session.photos.length > 0 && (
                        <div className="photos-grid">
                          <Row gutter={[8, 8]}>
                            {session.photos.map(photo => (
                              <Col span={12} key={photo.id}>
                                <div className="photo-item">
                                  <Image
                                    alt={photo.title || '照片'}
                                    src={photo.thumbnail || photo.url}
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                    className="photo-thumbnail"
                                    preview={{
                                      src: photo.url,
                                      title: photo.title || '照片'
                                    }}
                                  />
                                  <div className="photo-info">
                                    <Text className="photo-title">{photo.title || '未命名照片'}</Text>
                                    <div className="photo-tags">
                                      {photo.tags && photo.tags.length > 0 ? (
                                        photo.tags.map(tag => (
                                          <Tag key={tag} color="purple">
                                            {tag}
                                          </Tag>
                                        ))
                                      ) : (
                                        <Tag color="default">无标签</Tag>
                                      )}
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
          )}
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
                <Text strong>{currentSession.batchName}</Text>
                <br />
                <Text type="secondary">拍摄日期：{new Date(currentSession.date).toLocaleDateString('zh-CN')}</Text>
              </div>

              <Form onFinish={handlePasswordSubmit} className="password-form">
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 5, message: '密码格式不正确' }
                  ]}
                >
                  <Password
                    placeholder="请输入密码（姓名全拼+手机尾号）"
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
                  <UserOutlined /> 密码格式：姓名全拼 + 手机尾号(4位)
                </Text>
                <br />
                <Text type="secondary">
                  例如：{generatePassword(currentSession.friendFullName, currentSession.phoneTail)}
                </Text>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default Pictures;
