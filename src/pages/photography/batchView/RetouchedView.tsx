import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { Typography, Row, Col, Image, Button, Space, Spin, Empty, message, Card, Tag } from "antd";
import { ArrowLeftOutlined, StarOutlined, EyeOutlined, CrownOutlined } from "@ant-design/icons";
import { PhotographyController } from "../Controller";
import { PhotoSession } from "../Model";
import { createNavigateWithMeng } from "../../../utils/navigation";
import "../../../css/photography/photography.css";

const { Title, Text } = Typography;

const RetouchedPhotos = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  
  // 状态管理
  const [session, setSession] = useState<PhotoSession | null>(null);
  const [retouchedPhotos, setRetouchedPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  // 获取批次详情和精修照片
  const fetchSessionDetail = async (batchId: string) => {
    setLoading(true);
    try {
      // 1. 获取批次基本信息
      const batchResult = await PhotographyController.getAllPhotoSessions();
      const targetSession = batchResult.find(s => s.id === batchId);
      
      if (targetSession) {
        setSession(targetSession);
        
        // 2. 获取批次照片 - 使用新的接口，同时获取所有类型和精修照片
        const photosResult = await PhotographyController.getSessionPhotos(batchId);
        
        // 转换API返回的照片数据为本地Photo格式
        const convertPhotoData = (photo: any) => ({
          id: photo._id,
          url: photo.frontendUrl || photo.thumbnailUrl,
          thumbnail: photo.thumbnailUrl || photo.frontendUrl,
          title: photo.title,
          description: photo.description || '',
          tags: photo.tags || [],
          date: photo.shootDate || targetSession.date,
          sessionId: targetSession.id,
          isRetouched: photo.isRetouched || false,
          createdAt: photo.createdAt,
          updatedAt: photo.updatedAt
        });

        // TODO 数据结构重构
        // 处理所有照片
        const allPhotos = photosResult?.map(convertPhotoData) || [];
        
        // 筛选精修照片
        // const retouchedPhotosData = allPhotos.filter(photo => photo.isRetouched);
        
        setRetouchedPhotos([]);
      } else {
        message.error('批次不存在');
        navigateWithMeng('/photography/timeline');
      }
    } catch (error) {
      console.error('获取批次详情失败:', error);
      message.error('获取批次详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听URL参数变化
  useEffect(() => {
    if (params.batchId) {
      fetchSessionDetail(params.batchId);
    }
  }, [params.batchId]);

  // 返回时间线
  const handleBackToTimeline = () => {
    navigateWithMeng('/photography/timeline');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <Empty description="批次不存在或加载失败" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="retouched-photos-page">
        {/* 页面标题 */}
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToTimeline}
              style={{ marginRight: '16px' }}
            >
              返回时间线
            </Button>
            <Title level={2} style={{ margin: 0, flex: 1 }}>
              <StarOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              {session.batchName || `${session.friendName}的拍摄`} - 精修照片
            </Title>
            {isMeng && (
              <Tag color="purple" icon={<CrownOutlined />}>
                meng模式
              </Tag>
            )}
          </div>
          
          {/* 批次信息 */}
          <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
            <Space wrap>
              <Text strong>客户：</Text>
              <Text>{session.friendName}</Text>
              <Text strong>拍摄日期：</Text>
              <Text>{session.date}</Text>
              {session.location && (
                <>
                  <Text strong>地点：</Text>
                  <Text>{session.location}</Text>
                </>
              )}
              <Text strong>精修照片：</Text>
              <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {retouchedPhotos.length} 张
              </Text>
            </Space>
          </Card>
        </div>

        {/* 精修照片展示 */}
        {retouchedPhotos.length === 0 ? (
          <Empty 
            description="该批次暂无精修照片" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="retouched-photos-grid">
            <Row gutter={[16, 16]}>
              {retouchedPhotos.map((photo, index) => (
                <Col 
                  xs={24} sm={12} md={8} lg={6} xl={4} 
                  key={photo.id || index}
                >
                  <Card
                    hoverable
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #52c41a',
                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
                    }}
                    bodyStyle={{ padding: '8px' }}
                    cover={
                      <div style={{ position: 'relative' }}>
                        <Image
                          alt={photo.title}
                          src={photo.thumbnail || photo.url}
                          style={{ 
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
                                <EyeOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                                <span style={{ fontSize: '14px' }}>点击预览</span>
                              </div>
                            )
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(82, 196, 26, 0.9)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <StarOutlined />
                          精修
                        </div>
                      </div>
                    }
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: '14px',
                          display: 'block',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={photo.title}
                      >
                        {photo.title}
                      </Text>
                      {photo.tags && photo.tags.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {photo.tags.slice(0, 2).map(tag => (
                            <Tag key={tag} color="blue" style={{ fontSize: '10px', margin: '2px' }}>
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RetouchedPhotos;
