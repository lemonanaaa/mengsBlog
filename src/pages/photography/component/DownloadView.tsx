import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Button, Tag, Space, Empty, Row, Col, Card, Image, Typography, message, Tabs, Spin, Checkbox } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, FolderOutlined, UserOutlined, CalendarOutlined, EnvironmentOutlined, PictureOutlined, CrownOutlined } from "@ant-design/icons";
import { PhotographyController } from "../Controller";
import { PhotoSession, Photo } from "../Model";
import Layout from "../../common/Layout";
import { createNavigateWithMeng } from "../../../utils/navigation";
import "../../../css/photography/photography.css";

const { Title, Text } = Typography;

const DownloadView = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);
  
  // 状态管理
  const [session, setSession] = useState<PhotoSession | null>(null);
  const [originalPhotos, setOriginalPhotos] = useState<Photo[]>([]);
  const [retouchedPhotos, setRetouchedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'retouched'>('original');
  
  // 选择功能状态
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // 获取批次照片
  const fetchSessionPhotos = async (batchId: string) => {
    setLoading(true);
    try {
      // 获取批次照片，指定获取所有类型和精修照片
      const photosResult = await PhotographyController.getSessionPhotos(batchId, {
        types: ['all', 'retouched']
      });
      
      // 转换API返回的照片数据为本地Photo格式
      const convertPhotoData = (photo: any) => ({
        id: photo._id,
        url: photo.frontendUrl || photo.thumbnailUrl,
        thumbnail: photo.thumbnailUrl || photo.frontendUrl,
        title: photo.title,
        description: photo.description || '',
        tags: photo.tags || [],
        date: photo.shootDate || new Date().toISOString(),
        sessionId: batchId,
        isRetouched: photo.isRetouched || false,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt
      });

      // 处理照片数据
      let allPhotos: any[] = [];
      let retouchedPhotosData: any[] = [];
      let shootSessionData: any = null;
      
      if (Array.isArray(photosResult)) {
        // 如果返回的是数组（默认情况）
        allPhotos = photosResult.map(convertPhotoData);
        retouchedPhotosData = allPhotos.filter(photo => photo.isRetouched);
      } else {
        // 如果返回的是对象（包含 photos 和 retouchedPhotos）
        allPhotos = (photosResult.photos || []).map(convertPhotoData);
        retouchedPhotosData = (photosResult.retouchedPhotos || []).map(convertPhotoData);
        shootSessionData = photosResult.shootSession;
      }
      
      // 分离原始照片和精修照片
      const originalPhotosData = allPhotos.filter(photo => !photo.isRetouched);
      
      setOriginalPhotos(originalPhotosData);
      setRetouchedPhotos(retouchedPhotosData);
      
      // 使用真实的批次信息创建session对象
      setSession({
        id: batchId,
        date: shootSessionData?.shootDate || new Date().toISOString(),
        friendName: shootSessionData?.friendName || '客户',
        friendFullName: shootSessionData?.friendFullName || '',
        phoneTail: shootSessionData?.phoneTail || '',
        password: '',
        isPublic: shootSessionData?.isPublic || false,
        batchName: shootSessionData?.name || '照片下载',
        location: shootSessionData?.location || shootSessionData?.shootLocation || '',
        description: '',
        tags: shootSessionData?.tags || [],
        isFeatured: shootSessionData?.isFeatured || false,
        sortOrder: shootSessionData?.sortOrder || 0,
        theme: '',
        camera: '',
        lens: '',
        aperture: '',
        shutterSpeed: '',
        iso: '',
        focalLength: '',
        weather: '',
        lighting: '',
        photos: allPhotos,
        representativePhoto: null,
        totalPhotos: shootSessionData?.totalPhotos || allPhotos.length,
        createdAt: shootSessionData?.createdAt || new Date().toISOString(),
        updatedAt: shootSessionData?.updatedAt || new Date().toISOString()
      });
      
    } catch (error) {
      console.error('获取批次照片失败:', error);
      message.error('获取批次照片失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听URL参数变化
  useEffect(() => {
    if (params.batchId) {
      fetchSessionPhotos(params.batchId);
    }
  }, [params.batchId]);

  // 返回底片展示页面
  const handleBackToPictures = () => {
    navigateWithMeng('/photography/pictures');
  };

  // 切换选择模式
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    // 退出选择模式时清空选择
    if (isSelectMode) {
      setSelectedPhotos(new Set());
    }
  };

  // 选择/取消选择单张照片
  const handleSelectPhoto = (photoId: string) => {
    if (!isSelectMode) return;
    
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // 通用的批量下载函数
  const downloadPhotos = async (photos: Photo[], downloadType: 'selected' | 'original' | 'retouched') => {
    if (photos.length === 0) {
      const typeText = downloadType === 'selected' ? '选中' : (downloadType === 'original' ? '原始' : '精修');
      message.warning(`暂无${typeText}照片可下载`);
      return;
    }

    try {
      // 创建下载链接
      const downloadLinks = photos.map(photo => {
        let typeLabel = '';
        if (downloadType === 'selected') {
          typeLabel = photo.isRetouched ? '精修' : '原片';
        } else {
          typeLabel = downloadType === 'original' ? '原片' : '精修';
        }
        
        return {
          url: photo.url,
          filename: `${session?.friendName}_${typeLabel}_${photo.title || photo.id}.jpg`
        };
      });

      // 显示开始下载消息
      const typeText = downloadType === 'selected' ? '选中' : (downloadType === 'original' ? '原始' : '精修');
      message.success(`开始下载 ${photos.length} 张${typeText}照片`);

      // 批量下载
      for (let i = 0; i < downloadLinks.length; i++) {
        const link = downloadLinks[i];
        
        // 直接下载
        const a = document.createElement('a');
        a.href = link.url;
        a.download = link.filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log(`开始下载: ${link.filename}`);
        
        // 增加延迟时间，避免浏览器阻止多个下载
        if (i < downloadLinks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请稍后重试');
    }
  };

  // 批量下载选中的照片
  const handleBatchDownloadSelected = async () => {
    if (selectedPhotos.size === 0) {
      message.warning('请先选择要下载的照片');
      return;
    }

    // 获取所有照片（原片+精修）
    const allPhotos = [...originalPhotos, ...retouchedPhotos];
    const photosToDownload = allPhotos.filter(photo => selectedPhotos.has(photo.id));
    
    await downloadPhotos(photosToDownload, 'selected');
    
    // 下载完成后清空选择
    setSelectedPhotos(new Set());
  };

  // 批量下载照片
  const handleBatchDownload = async (photos: Photo[], type: 'original' | 'retouched') => {
    await downloadPhotos(photos, type);
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>正在加载照片...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="批次不存在" />
          <Button type="primary" onClick={handleBackToPictures} style={{ marginTop: 16 }}>
            返回底片展示
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="batch-view">
        {/* 页面头部 */}
        <div className="page-header">
          <Title level={2} style={{ marginBottom: '16px' }}>
            <DownloadOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            照片下载
          </Title>
          {isMeng && (
            <Tag color="purple" icon={<CrownOutlined />} style={{ marginBottom: '16px' }}>
              meng模式
            </Tag>
          )}
        </div>

        {/* 返回按钮和批次信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToPictures}
            >
              返回底片展示
            </Button>
          </div>
          <div style={{ flex: 1, textAlign: 'right', paddingRight: '20px' }}>
            <Title level={3} style={{ marginTop: 0, marginBottom: '16px', textAlign: 'right' }}>
              <FolderOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              {session.batchName || `${session.friendName} 的拍摄批次`}
            </Title>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginBottom: session.description ? '16px' : '0'
            }}>
              <Tag color="blue" icon={<UserOutlined />}>
                {session.friendName}
              </Tag>
              <Tag color="purple" icon={<CalendarOutlined />}>
                {new Date(session.date).toLocaleDateString('zh-CN')}
              </Tag>
              {session.location && (
                <Tag color="geekblue">
                  📍 {session.location}
                </Tag>
              )}
            </div>
            {session.description && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#666',
                borderLeft: '3px solid #1890ff',
                textAlign: 'left'
              }}>
                <Text strong>拍摄描述：</Text> {session.description}
              </div>
            )}
          </div>
        </div>

        {/* 照片展示和下载 */}
        <div className="photos-section">
          <div className="photos-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, marginRight: 'auto' }}>
              照片下载 (原始: {originalPhotos.length} 张, 精修: {retouchedPhotos.length} 张)
            </Title>
            <Space>
              {isSelectMode && selectedPhotos.size > 0 && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleBatchDownloadSelected}
                  style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  下载选中照片 ({selectedPhotos.size})
                </Button>
              )}
              <Button
                type={isSelectMode ? 'primary' : 'default'}
                icon={<DownloadOutlined />}
                onClick={toggleSelectMode}
              >
                {isSelectMode ? '退出选择下载' : '选择下载'}
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleBatchDownload(retouchedPhotos, 'retouched')}
                disabled={retouchedPhotos.length === 0}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                下载所有精修 ({retouchedPhotos.length})
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'original' | 'retouched')}
            items={[
              {
                key: 'original',
                label: `原始照片 (${originalPhotos.length})`,
                children: originalPhotos.length === 0 ? (
                  <Empty description="暂无原始照片" />
                ) : (
                  <div>
                    <Row className="photos-grid" gutter={[16, 16]}>
                      {originalPhotos.map(photo => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={photo.id}>
                          <Card
                            hoverable
                            style={{
                              cursor: isSelectMode ? 'pointer' : 'default',
                              border: isSelectMode 
                                ? (selectedPhotos.has(photo.id) ? '3px solid #1890ff' : '2px dashed #1890ff')
                                : undefined,
                              position: 'relative'
                            }}
                            onClick={() => isSelectMode && handleSelectPhoto(photo.id)}
                            cover={
                              <div style={{ position: 'relative' }}>
                                <Image
                                  alt="照片"
                                  src={photo.thumbnail}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                  style={{ height: 200, objectFit: 'cover' }}
                                  preview={{
                                    src: photo.url,
                                    title: photo.title || '照片'
                                  }}
                                />
                                {isSelectMode && selectedPhotos.has(photo.id) && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      backgroundColor: '#1890ff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✓
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <Card.Meta
                              title={photo.title || `照片 ${photo.id}`}
                              description={
                                <div>
                                  <div style={{ marginTop: 8 }}>
                                    {photo.tags && photo.tags.length > 0 && photo.tags.map(tag => (
                                      <Tag key={tag} color="blue" style={{ fontSize: '12px', marginBottom: 4 }}>
                                        {tag}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )
              },
              {
                key: 'retouched',
                label: `精修照片 (${retouchedPhotos.length})`,
                children: retouchedPhotos.length === 0 ? (
                  <Empty description="暂无精修照片" />
                ) : (
                  <div>
                    <Row className="photos-grid" gutter={[16, 16]}>
                      {retouchedPhotos.map(photo => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={photo.id}>
                          <Card
                            hoverable
                            style={{
                              cursor: isSelectMode ? 'pointer' : 'default',
                              border: isSelectMode 
                                ? (selectedPhotos.has(photo.id) ? '3px solid #52c41a' : '2px dashed #52c41a')
                                : undefined,
                              position: 'relative'
                            }}
                            onClick={() => isSelectMode && handleSelectPhoto(photo.id)}
                            cover={
                              <div style={{ position: 'relative' }}>
                                <Image
                                  alt="照片"
                                  src={photo.thumbnail}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                  style={{ height: 200, objectFit: 'cover' }}
                                  preview={{
                                    src: photo.url,
                                    title: photo.title || '照片'
                                  }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    background: 'rgba(82, 196, 26, 0.9)',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  精修
                                </div>
                                {isSelectMode && selectedPhotos.has(photo.id) && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      backgroundColor: '#52c41a',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✓
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <Card.Meta
                              title={photo.title || `精修照片 ${photo.id}`}
                              description={
                                <div>
                                  <div style={{ marginTop: 8 }}>
                                    {photo.tags && photo.tags.length > 0 && photo.tags.map(tag => (
                                      <Tag key={tag} color="green" style={{ fontSize: '12px', marginBottom: 4 }}>
                                        {tag}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </Layout>
  );
};

export default DownloadView;
