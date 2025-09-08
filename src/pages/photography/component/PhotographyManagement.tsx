import React, { useState, useContext, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import Layout from "../../common/Layout";
import pinyin from "pinyin";
import dayjs from 'dayjs';
import { createNavigateWithMeng } from "../../../utils/navigation";
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  message,
  Row,
  Col,
  Image,
  Tag,
  Modal,
  Form,
  DatePicker,
  Upload,
  Select,
  Divider,
  List,
  Popconfirm,
  Empty,
  Collapse,
  Switch,
  InputNumber
} from "antd";

import {
  UploadOutlined,
  CameraOutlined,
  PlusOutlined,
  DeleteOutlined,
  CrownOutlined,
  SaveOutlined,
  FolderOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  UpOutlined,
  DownOutlined,
  RightOutlined
} from "@ant-design/icons";
import { mengsBlogContext } from "../../common/Layout";
import { PhotographyController } from "../Controller";
import { PhotoUpload, PhotoSession, Photo, PRESET_TAGS } from "../Model";
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import "../../../css/photography/uploadPhotos.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const PhotographyManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const { blogCommonStore } = useContext(mengsBlogContext) as any;
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [editBatchForm] = Form.useForm();
  const [detailEditForm] = Form.useForm();

  // 使用pinyin包生成拼音
  const generatePinyin = (chineseName: string): string => {
    if (!chineseName) return '';

    try {
      // 使用pinyin包，设置style为NORMAL（不带声调）
      const result = pinyin(chineseName, {
        style: pinyin.STYLE_NORMAL
      });

      // 将二维数组扁平化并连接
      return result.flat().join('').toLowerCase();
    } catch (error) {
      console.error('拼音生成失败:', error);
      return chineseName; // 如果失败，返回原字符串
    }
  };

  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  // 权限检查：如果不是meng模式，显示权限不足页面
  if (!isMeng) {
    return (
      <Layout>
        <div className="photo-management">
          <div className="page-header" style={{ marginBottom: 12 }}>
            <Title level={2}>
              <FolderOutlined /> 底片管理
            </Title>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
            <Title level={3} style={{ color: '#666' }}>权限不足</Title>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '20px' }}>
              此页面需要管理员权限才能访问
            </Text>
            <Button
              type="primary"
              onClick={() => window.location.href = '/photography'}
              icon={<ArrowLeftOutlined />}
            >
              返回摄影页面
            </Button>
          </div>
        </div>
      </Layout>
    );
  }



  // 状态管理
  const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PhotoSession | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [batchEditActive, setBatchEditActive] = useState<string[]>([]);

  // 组件加载时获取所有批次
  useEffect(() => {
    fetchPhotoSessions();
  }, []); // 只在组件挂载时执行一次

  // 当URL参数变化时，自动加载对应的批次详情
  useEffect(() => {
    if (params.batchId && photoSessions.length > 0) {
      const targetSession = photoSessions.find(s => s.id === params.batchId);
      if (targetSession) {
        setCurrentSession(targetSession);
        setIsDeleteMode(false);
        setSelectedPhotos([]);
      }
    }
  }, [params.batchId, photoSessions]);


  // 获取所有照片批次
  const fetchPhotoSessions = async () => {
    setLoading(true);
    try {
      const sessions = await PhotographyController.getAllPhotoSessions();
      setPhotoSessions(sessions);
    } catch (error) {
      console.error('获取照片批次失败:', error);
      message.error('获取照片批次失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新批次
  const handleCreateBatch = async (values: any) => {
    try {
      // 自动生成姓名全拼
      const friendFullName = generatePinyin(values.friendName);

      const newSession = await PhotographyController.createPhotoSession({
        date: values.date.format('YYYY-MM-DD'),
        friendName: values.friendName,
        friendFullName: friendFullName,
        phoneTail: values.phoneTail,
        isPublic: values.isPublic || false,
        batchName: values.batchName || undefined,
        location: values.location || undefined,
        description: values.description || undefined,
        // 新增字段
        tags: values.tags || undefined,
        isFeatured: values.isFeatured || false,
        sortOrder: values.sortOrder || 0,
        theme: values.theme || undefined,
        camera: values.camera || undefined,
        lens: values.lens || undefined,
        aperture: values.aperture || undefined,
        shutterSpeed: values.shutterSpeed || undefined,
        iso: values.iso || undefined,
        focalLength: values.focalLength || undefined,
        weather: values.weather || undefined,
        lighting: values.lighting || undefined
      });

      if (newSession) {
        setPhotoSessions(prev => [...prev, newSession]);
        setShowBatchModal(false);
        batchForm.resetFields();
        message.success('批次创建成功！');
      }
    } catch (error) {
      message.error('创建批次失败，请重试');
    }
  };

  // 删除批次
  const handleDeleteBatch = async (sessionId: string) => {
    try {
      const success = await PhotographyController.deletePhotoSession(sessionId);
      if (success) {
        setPhotoSessions(prev => prev.filter(session => session.id !== sessionId));
        message.success('批次删除成功！');
      } else {
        message.error('删除失败，请重试');
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

  // 进入批次详情
  const handleEnterBatch = (session: PhotoSession) => {
    navigateWithMeng(`/photography/batch/${session.id}`);
  };

  // 选择/取消选择照片
  const handleTogglePhotoSelection = (photoId: string) => {
    if (!isDeleteMode) return;

    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  // 批量删除选中的照片
  const handleBatchDeletePhotos = async () => {
    if (selectedPhotos.length === 0) {
      message.warning('请先选择要删除的照片');
      return;
    }

    try {
      // 使用批量删除接口
      const result = await PhotographyController.deletePhotos(selectedPhotos);

      if (result.success && result.deletedCount > 0) {
        // 更新批次列表
        setPhotoSessions(prev => prev.map(s =>
          s.id === currentSession?.id ? { ...s, photos: s.photos.filter(photo => !selectedPhotos.includes(photo.id)) } : s
        ));

        setSelectedPhotos([]);
        setIsDeleteMode(false);

        if (result.failedIds.length > 0) {
          message.warning(`成功删除 ${result.deletedCount} 张照片，${result.failedIds.length} 张删除失败`);
        } else {
          message.success(`成功删除 ${result.deletedCount} 张照片`);
        }
      } else {
        message.error('删除失败，请重试');
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 编辑批次信息
  const handleEditBatch = (session: PhotoSession) => {
    setCurrentSession(session);
    setShowEditBatchModal(true);

    // 设置编辑表单的初始值
    editBatchForm.setFieldsValue({
      friendName: session.friendName,
      friendFullName: session.friendFullName,
      phoneTail: session.phoneTail,
      isPublic: session.isPublic,
      batchName: session.batchName,
      location: session.location,
      description: session.description,
      // 日期字段需要转换为 moment 对象
      date: session.date ? dayjs(session.date) : undefined,
      // 新增字段
      tags: session.tags,
      isFeatured: session.isFeatured,
      sortOrder: session.sortOrder,
      theme: session.theme,
      camera: session.camera,
      lens: session.lens,
      aperture: session.aperture,
      shutterSpeed: session.shutterSpeed,
      iso: session.iso,
      focalLength: session.focalLength,
      weather: session.weather,
      lighting: session.lighting
    });
  };

  // 更新批次信息
  const handleUpdateBatch = async (values: any) => {
    if (!currentSession) return;

    try {
      // 确保姓名全拼有值，如果没有则自动生成
      let friendFullName = values.friendFullName;
      if (!friendFullName && values.friendName) {
        friendFullName = generatePinyin(values.friendName);
      }

      const updatedSession = await PhotographyController.updatePhotoSession(currentSession.id, {
        date: values.date ? values.date.format('YYYY-MM-DD') : currentSession.date,
        friendName: values.friendName,
        friendFullName: friendFullName,
        phoneTail: values.phoneTail,
        isPublic: values.isPublic || false,
        batchName: values.batchName || undefined,
        location: values.location || undefined,
        description: values.description || undefined,
        // 新增字段
        tags: values.tags || undefined,
        isFeatured: values.isFeatured || false,
        sortOrder: values.sortOrder || 0,
        theme: values.theme || undefined,
        camera: values.camera || undefined,
        lens: values.lens || undefined,
        aperture: values.aperture || undefined,
        shutterSpeed: values.shutterSpeed || undefined,
        iso: values.iso || undefined,
        focalLength: values.focalLength || undefined,
        weather: values.weather || undefined,
        lighting: values.lighting || undefined
      });

      if (updatedSession) {
        // 更新批次列表
        setPhotoSessions(prev => prev.map(s =>
          s.id === currentSession.id ? updatedSession : s
        ));


        setShowEditBatchModal(false);
        editBatchForm.resetFields();
        message.success('批次信息更新成功！');
      }
    } catch (error) {
      message.error('更新批次失败，请重试');
    }
  };


  return (
    <Layout>
      <div className="photo-management">
        {/* 页面标题 */}
        <div className="page-header" style={{ marginBottom: 12 }}>
          <Title level={2}>
            <FolderOutlined /> 底片管理
          </Title>
          {isMeng && (
            <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 12 }}>
              meng模式
            </Tag>
          )}
        </div>

        {/* 批次列表显示 */}
        <>
          {/* 创建新批次按钮 */}
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowBatchModal(true)}
            >
              创建新批次
            </Button>
          </div>

          {/* 批次列表 */}
          <div>
            <Title level={4}>拍摄批次列表 ({photoSessions.length} 个)</Title>
            {loading ? (
              <div>加载中...</div>
            ) : photoSessions.length === 0 ? (
              <Empty description="暂无拍摄批次" />
            ) : (
              <Row gutter={[16, 16]}>
                {photoSessions.map(session => (
                  <Col xs={24} sm={12} lg={9} xl={7} key={session.id}>
                    <Card
                      hoverable
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEnterBatch(session)}
                      cover={
                        session.representativePhoto?.thumbnailUrl || (session.photos && session.photos.length > 0) ? (
                          <div style={{
                            height: 150,
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: '#f5f5f5'
                          }}>
                            {/* 代表性照片或主要照片 */}
                            <Image
                              alt="批次封面"
                              src={session.representativePhoto?.thumbnailUrl || session.photos[0]?.thumbnail}
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            {/* 显示数量文字 */}
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {session.totalPhotos || session.photos.length} 张
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            height: 150,
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999'
                          }}>
                            <FolderOutlined style={{ fontSize: 32 }} />
                          </div>
                        )
                      }
                      actions={[
                        <EditOutlined
                          key="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBatch(session);
                          }}
                        />,
                        <Popconfirm
                          title="确定要删除这个批次吗？"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteBatch(session.id);
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <DeleteOutlined
                            key="delete"
                            style={{ color: '#ff4d4f' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      ]}
                    >
                      <Card.Meta
                        title={session.batchName || `${session.friendName} 的拍摄批次`}
                        description={
                          <div>
                            {/* 标签行：所有标签在一行，自动换行 */}
                            <div style={{
                              marginBottom: 8,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              alignItems: 'center'
                            }}>
                              <Tag color="blue" icon={<UserOutlined />}>
                                {session.friendName}
                              </Tag>
                              <Tag color="purple" icon={<CalendarOutlined />}>
                                {session.date ? dayjs(session.date).format('YYYY-MM-DD') : '未知日期'}
                              </Tag>
                              {session.location && (
                                <Tag color="geekblue">
                                  📍 {session.location}
                                </Tag>
                              )}
                              <Tag color={session.isPublic ? 'green' : 'orange'}>
                                {session.isPublic ? '公开' : '私密'}
                              </Tag>
                            </div>
                            {session.description && (
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                                {session.description}
                              </div>
                            )}
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              照片数量: {session.totalPhotos || session.photos.length} 张
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </>
        {/* 编辑批次弹窗 */}
        <Modal
          title={
            <Space>
              <EditOutlined />
              编辑拍摄批次
            </Space>
          }
          open={showEditBatchModal}
          onCancel={() => setShowEditBatchModal(false)}
          footer={null}
          width={500}
        >
          {currentSession && (
            <Form
              form={editBatchForm}
              layout="vertical"
              onFinish={handleUpdateBatch}
            >
              {/* 拍摄批次名称 - 第一排，虽然不是必填但很重要 */}
              <Form.Item
                name="batchName"
                label="拍摄批次名称"
              >
                <Input placeholder="如：春日樱花人像拍摄" />
              </Form.Item>

              {/* 客户姓名和姓名全拼 - 第二行 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="friendName"
                    label="客户姓名"
                    rules={[{ required: true, message: '请输入客户姓名' }]}
                  >
                    <Input
                      placeholder="如：张伟"
                      onChange={(e) => {
                        // 自动生成姓名全拼
                        const pinyin = generatePinyin(e.target.value);
                        editBatchForm.setFieldsValue({ friendFullName: pinyin });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="friendFullName"
                    label=" "
                  >
                    <Input
                      placeholder="自动生成"
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 拍摄日期和手机尾号 - 第三行 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="date"
                    label="拍摄日期"
                    rules={[{ required: true, message: '请选择拍摄日期' }]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }} 
                      placeholder="请选择新的拍摄日期"
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phoneTail"
                    label="手机尾号"
                    rules={[{ required: true, message: '请输入手机尾号' }]}
                  >
                    <Input placeholder="如：1234" />
                  </Form.Item>
                </Col>
              </Row>

              {/* 基本设置字段 */}
              <Form.Item
                name="isPublic"
                label="可见性"
                extra="控制后端是否返回该批次数据，不影响密码验证"
              >
                <Select placeholder="选择可见性">
                  <Option value={false}>私密（后端不返回）</Option>
                  <Option value={true}>公开（后端返回）</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="location"
                label="拍摄地点"
              >
                <Input placeholder="如：樱花公园、咖啡厅等" />
              </Form.Item>

              <Form.Item
                name="description"
                label="拍摄描述"
              >
                <TextArea
                  placeholder="拍摄主题、风格、特殊要求等描述信息"
                  rows={3}
                  maxLength={100}
                  showCount
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                  >
                    保存修改
                  </Button>
                  <Button onClick={() => setShowEditBatchModal(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* 创建批次弹窗 */}
        <Modal
          title={
            <Space>
              <FolderOutlined />
              创建新拍摄批次
            </Space>
          }
          open={showBatchModal}
          onCancel={() => setShowBatchModal(false)}
          footer={null}
          width={500}
        >
          <Form
            form={batchForm}
            layout="vertical"
            onFinish={handleCreateBatch}
          >
            {/* 拍摄批次名称 - 第一排，虽然不是必填但很重要 */}
            <Form.Item
              name="batchName"
              label="拍摄批次名称"
            >
              <Input placeholder="如：春日樱花人像拍摄" />
            </Form.Item>

            {/* 客户姓名和姓名全拼 - 第二行 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="friendName"
                  label="客户姓名"
                  rules={[{ required: true, message: '请输入客户姓名' }]}
                >
                  <Input
                    placeholder="如：张伟"
                    onChange={(e) => {
                      // 自动生成姓名全拼
                      const pinyin = generatePinyin(e.target.value);
                      batchForm.setFieldsValue({ friendFullName: pinyin });
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="friendFullName"
                  label=" "
                >
                  <Input
                    placeholder="自动生成"
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 拍摄日期和手机尾号 - 第三行 */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label="拍摄日期"
                  rules={[{ required: true, message: '请选择拍摄日期' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phoneTail"
                  label="手机尾号"
                  rules={[{ required: true, message: '请输入手机尾号' }]}
                >
                  <Input placeholder="如：1234" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="isPublic"
              label="可见性"
              extra="控制后端是否返回该批次数据，不影响密码验证"
            >
              <Select placeholder="选择可见性">
                <Option value={false}>私密（后端不返回）</Option>
                <Option value={true}>公开（后端返回）</Option>
              </Select>
            </Form.Item>

            {/* 其他可选字段 */}
            <Form.Item
              name="location"
              label="拍摄地点"
            >
              <Input placeholder="如：樱花公园、咖啡厅等" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述信息"
            >
              <TextArea
                placeholder="拍摄主题、风格、特殊要求等描述信息"
                rows={3}
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  创建批次
                </Button>
                <Button onClick={() => setShowBatchModal(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

      </div>
    </Layout>
  );
};

export default PhotographyManagement;
