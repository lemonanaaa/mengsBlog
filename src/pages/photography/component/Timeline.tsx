import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import { mengsBlogContext } from "../../common/Layout";
import { Typography, Tag, Card, Row, Col, Image, Button, Space, Spin, Empty, Modal, message } from "antd";
import { CrownOutlined, ClockCircleOutlined, CameraOutlined, EnvironmentOutlined, UserOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, FolderOutlined, StarOutlined } from "@ant-design/icons";
import { PhotographyController } from "../Controller";
import { PhotoSession } from "../Model";
import { createNavigateWithMeng } from "../../../utils/navigation";
import "../../../css/career/blogsTimeline.css";

const { Title, Text, Paragraph } = Typography;

const PhotographyTimeline = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blogCommonStore } = useContext(mengsBlogContext) as any;
  
  // 状态管理
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  // 获取拍摄批次列表
  const fetchPhotoSessions = async () => {
    setLoading(true);
    try {
      const sessions = await PhotographyController.getAllPhotoSessions();
      // 按日期倒序排列（最新的在前）
      const sortedSessions = sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPhotoSessions(sortedSessions);
    } catch (error) {
      console.error('获取拍摄批次失败:', error);
      message.error('获取拍摄批次失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除拍摄批次
  const deleteSession = async (id: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除拍摄批次《${title}》吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await PhotographyController.deletePhotoSession(id);
          message.success('拍摄批次删除成功！');
          fetchPhotoSessions();
        } catch (error) {
          console.error("删除失败:", error);
          message.error('网络错误，删除失败');
        }
      },
    });
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
  const getStatusColor = (isPublic: boolean) => {
    return isPublic ? 'green' : 'orange';
  };

  // 获取状态文本
  const getStatusText = (isPublic: boolean) => {
    return isPublic ? '公开' : '私密';
  };

  // 切换批次展开/收起状态
  const toggleSessionExpansion = (sessionId: string) => {
    const newExpandedSessions = new Set(expandedSessions);
    if (newExpandedSessions.has(sessionId)) {
      newExpandedSessions.delete(sessionId);
    } else {
      newExpandedSessions.add(sessionId);
    }
    setExpandedSessions(newExpandedSessions);
  };

  // 获取精修照片作为封面
  const getRetouchedPhoto = (session: PhotoSession) => {
    if (session.photos && session.photos.length > 0) {
      // 优先选择精修照片
      const retouchedPhotos = session.photos.filter(photo => photo.isRetouched);
      if (retouchedPhotos.length > 0) {
        // 如果有多个精修照片，选择第一张
        return retouchedPhotos[0];
      }
      // 如果没有精修照片，选择代表性照片
      if (session.representativePhoto) {
        return {
          id: 'representative',
          url: session.representativePhoto.imageUrl,
          thumbnail: session.representativePhoto.thumbnailUrl,
          title: session.representativePhoto.title,
          isRetouched: session.representativePhoto.isRetouched
        };
      }
      // 最后选择第一张照片
      return session.photos[0];
    }
    return null;
  };

  // 获取精修照片数量
  const getRetouchedPhotoCount = (session: PhotoSession) => {
    let count = 0;
    if (session.photos && session.photos.length > 0) {
      count += session.photos.filter(photo => photo.isRetouched).length;
    }
    // 如果代表性照片也是精修的，也要计算在内
    if (session.representativePhoto && session.representativePhoto.isRetouched) {
      count += 1;
    }
    return count;
  };

  // 获取所有精修照片
  const getAllRetouchedPhotos = (session: PhotoSession) => {
    const retouchedPhotos = [];
    
    // 添加照片列表中的精修照片
    if (session.photos && session.photos.length > 0) {
      retouchedPhotos.push(...session.photos.filter(photo => photo.isRetouched));
    }
    
    // 添加代表性照片（如果是精修的且不在照片列表中）
    if (session.representativePhoto && session.representativePhoto.isRetouched) {
      const isAlreadyIncluded = retouchedPhotos.some(photo => 
        photo.url === session.representativePhoto.imageUrl
      );
      if (!isAlreadyIncluded) {
        retouchedPhotos.push({
          id: 'representative',
          url: session.representativePhoto.imageUrl,
          thumbnail: session.representativePhoto.thumbnailUrl,
          title: session.representativePhoto.title,
          isRetouched: true
        });
      }
    }
    
    return retouchedPhotos;
  };

  useEffect(() => {
    fetchPhotoSessions();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="blogs-timeline-loading">
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  if (photoSessions.length === 0) {
    return (
      <Layout>
        <div className="blogs-timeline-empty">
          <Empty description="暂无拍摄批次" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="blogs-timeline-page">
        <div className="blogs-timeline-header">
          <div className="blogs-timeline-header-container">
            {/* 标题部分 - 始终居中 */}
            <div className="blogs-timeline-title-section">
              <Title level={2} className="blogs-timeline-title">
                <ClockCircleOutlined /> 拍摄时间线
              </Title>
              <Text type="secondary" className="blogs-timeline-subtitle">按时间顺序展示所有拍摄批次的精修照片</Text>
              {isMeng && (
                <div className="blogs-timeline-meng-tag">
                  <Tag color="purple" icon={<CrownOutlined />}>meng模式</Tag>
                </div>
              )}
            </div>
            
            {/* 新建批次按钮 - 绝对定位在右侧 */}
            {isMeng && (
              <Button
                type="primary"
                className="blogs-timeline-new-button"
                onClick={() => navigateWithMeng('/photography/management')}
              >
                新建批次
              </Button>
            )}
          </div>
        </div>

        <div className="timeline-container">
          {photoSessions.map((session, index) => {
            const { date, time } = formatDate(session.date);
            const retouchedPhoto = getRetouchedPhoto(session);
            const retouchedCount = getRetouchedPhotoCount(session);
            const totalPhotos = session.totalPhotos || session.photos?.length || 0;

            return (
              <div key={session.id} className="timeline-row">
                {/* 左侧时间区域 */}
                <div className="timeline-time-section">
                  <div className="timeline-time-text">
                    <div>{date}</div>
                    <div className="timeline-time-detail">{time}</div>
                  </div>
                </div>

                {/* 中间时间轴区域 */}
                <div className="timeline-axis-section">
                  {/* 时间轴节点 */}
                  <div 
                    className={`timeline-dot timeline-dot--${session.isPublic ? 'published' : 'draft'} ${session.isFeatured ? 'timeline-dot--featured' : ''}`}
                  />
                  
                  {/* 连接线 - 只在非最后一行显示 */}
                  {index < photoSessions.length - 1 && (
                    <div className="timeline-connector" />
                  )}
                </div>

                {/* 右侧内容区域 */}
                <div className="timeline-content-section">
                  <Card
                    className={`timeline-card ${session.isFeatured ? 'featured-blog-card' : ''}`}
                    hoverable
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigateWithMeng(`/photography/batch/${session.id}`)}
                      >
                        查看批次
                      </Button>,
                      ...(isMeng ? [
                        <Button
                          key="delete"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteSession(session.id, session.batchName || session.friendName)}
                        >
                          删除
                        </Button>
                      ] : [])
                    ]}
                  >
                    <div className="blog-card-tags">
                      <Space wrap>
                        {/* 精选批次标识 */}
                        {session.isFeatured && (
                          <span className="featured-blog-identifier">
                            <span className="featured-blog-star">
                              <StarOutlined />
                            </span>
                            <Text strong className="featured-blog-text">
                              精选批次
                            </Text>
                          </span>
                        )}
                        <Text type="secondary">
                          {/* <CalendarOutlined /> {date} {time} */}
                        </Text>
                        {isMeng && (
                          <Text type="secondary">
                            <CameraOutlined /> 总照片: {totalPhotos} 张
                          </Text>
                        )}
                        <Text type="secondary">
                          <StarOutlined /> 精修: {retouchedCount} 张
                        </Text>
                        {session.location && (
                          <Tag color="blue" icon={<EnvironmentOutlined />}>
                            {session.location}
                          </Tag>
                        )}
                        {session.tags && session.tags.length > 0 && (
                          <Tag color="purple">
                            {session.tags[0]}
                          </Tag>
                        )}
                      </Space>
                    </div>

                    <Title level={4} className="blog-card-title">
                      {session.batchName || `${session.friendName}的拍摄`}
                    </Title>

                    {session.description && (
                      <Paragraph className="blog-card-summary">
                        {session.description}
                      </Paragraph>
                    )}

                    {/* 精修照片展示 */}
                    {(() => {
                      const allRetouchedPhotos = getAllRetouchedPhotos(session);
                      if (allRetouchedPhotos.length > 0) {
                        return (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <Text strong style={{ fontSize: '14px' }}>
                                <StarOutlined /> 精修照片 ({allRetouchedPhotos.length}张)
                              </Text>
                            </div>
                            <Row gutter={[8, 8]}>
                              {allRetouchedPhotos.slice(0, 4).map((photo, photoIndex) => (
                                <Col span={6} key={photo.id || photoIndex}>
                                  <div style={{ position: 'relative' }}>
                                    <Image
                                      src={photo.thumbnail || photo.url}
                                      alt={photo.title}
                                      style={{ 
                                        width: '100%', 
                                        height: '120px', 
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        border: '2px solid #52c41a'
                                      }}
                                      preview={{
                                        src: photo.url
                                      }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      top: '4px',
                                      right: '4px',
                                      background: 'rgba(82, 196, 26, 0.9)',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontSize: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      <StarOutlined />
                                    </div>
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    textAlign: 'center', 
                                    marginTop: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {photo.title}
                                  </div>
                                </Col>
                              ))}
                            </Row>
                            {allRetouchedPhotos.length > 4 && (
                              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  还有 {allRetouchedPhotos.length - 4} 张精修照片...
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}


                    <div className="blog-card-meta">
                      <Text type="secondary" className="blog-card-meta-text">
                        创建时间: {formatDate(session.createdAt).date} | 更新时间: {formatDate(session.updatedAt).date}
                      </Text>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default PhotographyTimeline;