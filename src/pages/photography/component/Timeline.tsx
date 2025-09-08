import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../common/Layout";
import { mengsBlogContext } from "../../common/Layout";
import { Typography, Tag, Card, Row, Col, Image, Button, Space, Spin, Empty, Modal, message } from "antd";
import { CrownOutlined, ClockCircleOutlined, CameraOutlined, EnvironmentOutlined, UserOutlined, EyeOutlined, StarOutlined, MoreOutlined, DownOutlined, UpOutlined, LoadingOutlined } from "@ant-design/icons";
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
  const [expandedRetouchedPhotos, setExpandedRetouchedPhotos] = useState<{[key: string]: any[]}>({});
  const [loadingRetouchedPhotos, setLoadingRetouchedPhotos] = useState<Set<string>>(new Set());
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  // 获取拍摄批次列表（只获取有精修图的批次）
  const fetchPhotoSessions = async () => {
    setLoading(true);
    try {
      const sessions = await PhotographyController.getAllPhotoSessions(true); // 只获取有精修图的批次
      setPhotoSessions(sessions);
    } catch (error) {
      console.error('获取拍摄批次失败:', error);
      message.error('获取拍摄批次失败');
    } finally {
      setLoading(false);
    }
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

  // 切换精修照片展开/收起状态
  const toggleRetouchedExpansion = async (sessionId: string) => {
    const newExpandedSessions = new Set(expandedSessions);
    
    if (newExpandedSessions.has(sessionId)) {
      // 收起
      newExpandedSessions.delete(sessionId);
      setExpandedSessions(newExpandedSessions);
    } else {
      // 展开 - 获取精修照片
      newExpandedSessions.add(sessionId);
      setExpandedSessions(newExpandedSessions);
      
      // 如果还没有加载过精修照片，则调用接口获取
      if (!expandedRetouchedPhotos[sessionId]) {
        await fetchRetouchedPhotos(sessionId);
      }
    }
  };

  // 获取指定批次的精修照片
  const fetchRetouchedPhotos = async (sessionId: string) => {
    setLoadingRetouchedPhotos(prev => new Set(prev).add(sessionId));
    try {
      // 调用接口获取该批次的精修照片，只获取精修图片
      const photosResult = await PhotographyController.getSessionPhotos(sessionId, { types: ['retouched'] });
      
      // 转换API返回的照片数据为本地Photo格式
      const convertPhotoData = (photo: any) => ({
        id: photo._id,
        url: photo.frontendUrl || photo.thumbnailUrl,
        thumbnail: photo.thumbnailUrl || photo.frontendUrl,
        title: photo.title,
        description: photo.description || '',
        tags: photo.tags || [],
        date: photo.shootDate,
        sessionId: sessionId,
        isRetouched: photo.isRetouched || false,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt
      });

      // 直接使用后端返回的精修照片数据
      const retouchedPhotos = photosResult?.map(convertPhotoData) || [];
      
      // 更新状态
      setExpandedRetouchedPhotos(prev => ({
        ...prev,
        [sessionId]: retouchedPhotos
      }));
    } catch (error) {
      console.error('获取精修照片失败:', error);
      message.error('获取精修照片失败');
    } finally {
      setLoadingRetouchedPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionId);
        return newSet;
      });
    }
  };

  // 获取精修照片作为封面
  const getRetouchedPhoto = (session: PhotoSession) => {
    // 优先使用新的 retouchedPhoto 数组
    if ((session as any).retouchedPhoto && (session as any).retouchedPhoto.length > 0) {
      const firstRetouched = (session as any).retouchedPhoto[0];
      return {
        id: firstRetouched.filename || firstRetouched.title,
        url: firstRetouched.imageUrl,
        thumbnail: firstRetouched.thumbnailUrl,
        title: firstRetouched.title,
        isRetouched: true
      };
    }
    
    return null;
  };

  // 获取精修照片数量
  const getRetouchedPhotoCount = (session: PhotoSession) => {
    if ((session as any).retouchedPhoto && (session as any).retouchedPhoto.length > 0) {
      return (session as any).retouchedPhoto.length;
    }
    return 0;
  };

  // 获取所有精修照片
  const getAllRetouchedPhotos = (session: PhotoSession) => {
    if ((session as any).retouchedPhoto && (session as any).retouchedPhoto.length > 0) {
      return (session as any).retouchedPhoto.map((photo: any) => ({
        id: photo.filename || photo.title,
        url: photo.imageUrl,
        thumbnail: photo.thumbnailUrl,
        title: photo.title,
        isRetouched: true,
        retouchedAt: photo.retouchedAt
      }));
    }
    return [];
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
                      // 暂时隐藏查看全部按钮，等精修页面完善后再显示
                      // <Button
                      //   type="link"
                      //   icon={<EyeOutlined />}
                      //   onClick={() => navigateWithMeng(`/photography/retouched/${session.id}`)}
                      // >
                      //   查看全部
                      // </Button>
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
                            <div style={{ 
                              marginBottom: '12px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center' 
                            }}>
                              <Text strong style={{ fontSize: '14px' }}>
                                <StarOutlined /> 精修照片 ({allRetouchedPhotos.length}张)
                              </Text>
                              {allRetouchedPhotos.length > 4 && (
                                <Button
                                  type="link"
                                  size="small"
                                  icon={loadingRetouchedPhotos.has(session.id) ? <LoadingOutlined /> : (expandedSessions.has(session.id) ? <UpOutlined /> : <DownOutlined />)}
                                  onClick={() => toggleRetouchedExpansion(session.id)}
                                  loading={loadingRetouchedPhotos.has(session.id)}
                                  style={{ 
                                    padding: '0 8px',
                                    height: 'auto',
                                    fontSize: '12px'
                                  }}
                                >
                                  {expandedSessions.has(session.id) ? '收起' : '展开查看全部'}
                                </Button>
                              )}
                            </div>
                            <Row gutter={[8, 8]}>
                              {(expandedSessions.has(session.id) ? 
                                (expandedRetouchedPhotos[session.id] || allRetouchedPhotos) : 
                                allRetouchedPhotos.slice(0, 4)
                              ).map((photo, photoIndex) => (
                                <Col span={6} key={photo.id || photoIndex}>
                                  <div 
                                    style={{ 
                                      position: 'relative',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  >
                                    <Image
                                      src={photo.thumbnail || photo.url}
                                      alt={photo.title}
                                      style={{ 
                                        width: '100%', 
                                        height: '200px', 
                                        objectFit: 'cover'
                                      }}
                                      preview={{
                                        src: photo.url,
                                        mask: (
                                          <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            color: 'white'
                                          }}>
                                            <EyeOutlined style={{ fontSize: '20px', marginBottom: '4px' }} />
                                            <span style={{ fontSize: '12px' }}>预览</span>
                                          </div>
                                        )
                                      }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '4px',
                                      left: '4px',
                                      right: '4px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: 'white',
                                      padding: '2px 4px',
                                      borderRadius: '3px',
                                      fontSize: '10px',
                                      textAlign: 'center',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {photo.title}
                                    </div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
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