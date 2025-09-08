import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Button, Tag, Space, Input, InputNumber, Select, Switch, Collapse, Divider, Empty, Row, Col, Card, Image, Modal, Form, DatePicker, Upload, Typography, message } from "antd";
import { FolderOutlined, UserOutlined, ArrowLeftOutlined, CalendarOutlined, SettingOutlined, EditOutlined, SaveOutlined, UpOutlined, DeleteOutlined, UploadOutlined, CrownOutlined } from "@ant-design/icons";
import { PhotographyController } from "../Controller";
import { PhotoSession, Photo, PRESET_TAGS } from "../Model";
import { apiRequest } from "../../../config/api";
import Layout from "../../common/Layout";
import pinyin from "pinyin";
import moment from "moment";
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { createNavigateWithMeng } from "../../../utils/navigation";
import "../../../css/photography/photography.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;


export default function BatchView() {
    const params = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // 检查是否为 Meng 模式
    const isMeng = searchParams.get('meng') === 'true';

    // 权限检查：如果不是meng模式，显示权限不足页面
    if (!isMeng) {
        return (
            <Layout>
                <div style={{ padding: '50px', textAlign: 'center' }}>
                    <Title level={2}>权限不足</Title>
                    <Text>您没有权限访问此页面</Text>
                </div>
            </Layout>
        );
    }

    // 状态管理
    const [batch, setBatch] = useState<PhotoSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [batchEditActive, setBatchEditActive] = useState<string[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // 表单实例
    const [detailEditForm] = Form.useForm();
    const [form] = Form.useForm();

    // 生成拼音函数
    const generatePinyin = (chineseName: string): string => {
        if (!chineseName) return '';
        try {
            const result = pinyin(chineseName, { style: pinyin.STYLE_NORMAL });
            return result.flat().join('').toLowerCase();
        } catch (error) {
            console.error('拼音生成失败:', error);
            return chineseName;
        }
    };

    // 获取批次详情和照片
    const fetchBatchDetail = async (batchId: string) => {
        setLoading(true);
        try {
            // 1. 获取批次基本信息
            const batchResult = await apiRequest(`/shoot-sessions/${batchId}`);

            if (batchResult.success && batchResult.data) {
                // 2. 获取批次照片
                const photosResult = await apiRequest(`/shoot-sessions/${batchId}/photos`);

                // 添加批次照片的展示逻辑
                // 转换API返回的照片数据为本地Photo格式
                const convertedPhotos = photosResult.data?.photos?.map((photo: any) => ({
                    id: photo._id,
                    url: photo.frontendUrl || photo.thumbnailUrl,
                    thumbnail: photo.thumbnailUrl || photo.frontendUrl,
                    title: photo.title,
                    description: photo.description || '',
                    tags: photo.tags || [],
                    date: photo.shootDate || batchResult.data.shootSession?.shootDate,
                    sessionId: batchResult.data.shootSession?.id || batchResult.data.id,
                    createdAt: photo.createdAt,
                    updatedAt: photo.updatedAt
                })) || [];

                // 转换API数据格式为本地PhotoSession格式
                const batchData: PhotoSession = {
                    id: batchResult.data.shootSession?.id || batchResult.data.id,
                    date: batchResult.data.shootSession?.shootDate || batchResult.data.date,
                    friendName: batchResult.data.shootSession?.friendName || batchResult.data.friendName,
                    friendFullName: batchResult.data.shootSession?.friendFullName || batchResult.data.friendFullName,
                    phoneTail: batchResult.data.shootSession?.phoneTail || batchResult.data.phoneTail,
                    isPublic: batchResult.data.shootSession?.isPublic || batchResult.data.isPublic,
                    batchName: batchResult.data.shootSession?.name || batchResult.data.batchName,
                    location: batchResult.data.shootSession?.location || batchResult.data.location,
                    description: batchResult.data.shootSession?.description || batchResult.data.description,
                    theme: batchResult.data.shootSession?.theme || batchResult.data.theme,
                    camera: batchResult.data.shootSession?.camera || batchResult.data.camera,
                    lens: batchResult.data.shootSession?.lens || batchResult.data.lens,
                    aperture: batchResult.data.shootSession?.settings?.aperture || batchResult.data.settings?.aperture,
                    shutterSpeed: batchResult.data.shootSession?.settings?.shutterSpeed || batchResult.data.settings?.shutterSpeed,
                    iso: batchResult.data.shootSession?.settings?.iso || batchResult.data.settings?.iso,
                    focalLength: batchResult.data.shootSession?.settings?.focalLength || batchResult.data.settings?.focalLength,
                    weather: batchResult.data.shootSession?.weather || batchResult.data.weather,
                    lighting: batchResult.data.shootSession?.lighting || batchResult.data.lighting,
                    tags: batchResult.data.shootSession?.tags || batchResult.data.tags,
                    isFeatured: batchResult.data.shootSession?.isFeatured || batchResult.data.isFeatured,
                    sortOrder: batchResult.data.shootSession?.sortOrder || batchResult.data.sortOrder,
                    createdAt: batchResult.data.shootSession?.createdAt || batchResult.data.createdAt,
                    updatedAt: batchResult.data.shootSession?.updatedAt || batchResult.data.updatedAt,
                    photos: convertedPhotos, // 使用转换后的照片数据
                    password: ''
                };

                setBatch(batchData);

                // 设置编辑表单的初始值
                detailEditForm.setFieldsValue({
                    friendName: batchData.friendName,
                    friendFullName: batchData.friendFullName,
                    phoneTail: batchData.phoneTail,
                    isPublic: batchData.isPublic,
                    batchName: batchData.batchName,
                    location: batchData.location,
                    description: batchData.description,
                    date: batchData.date ? moment(batchData.date) : undefined,
                    tags: batchData.tags,
                    isFeatured: batchData.isFeatured,
                    sortOrder: batchData.sortOrder,
                    theme: batchData.theme,
                    camera: batchData.camera,
                    lens: batchData.lens,
                    aperture: batchData.aperture,
                    shutterSpeed: batchData.shutterSpeed,
                    iso: batchData.iso,
                    focalLength: batchData.focalLength,
                    weather: batchData.weather,
                    lighting: batchData.lighting
                });

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
            fetchBatchDetail(params.batchId);
        }
    }, [params.batchId]);

    // 通用导航函数，自动保持meng参数
    const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

    // 返回批次列表
    const handleBackToBatches = () => {
        navigateWithMeng('/photography/management');
    };

    // 更新批次信息
    const handleUpdateBatchInDetail = async (values: any) => {
        if (!batch) return;

        try {
            let friendFullName = values.friendFullName;
            if (!friendFullName && values.friendName) {
                friendFullName = generatePinyin(values.friendName);
            }

            const updatedSession = await PhotographyController.updatePhotoSession(batch.id, {
                date: values.date.format('YYYY-MM-DD'),
                friendName: values.friendName,
                friendFullName: friendFullName,
                phoneTail: values.phoneTail,
                isPublic: values.isPublic || false,
                batchName: values.batchName || undefined,
                location: values.location || undefined,
                description: values.description || undefined,
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
                setBatch(updatedSession);
                detailEditForm.resetFields();
                message.success('批次信息更新成功！');
            }
        } catch (error) {
            message.error('更新批次失败，请重试');
        }
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
                // 更新本地状态，从界面中移除已删除的照片
                if (batch) {
                    const updatedBatch = {
                        ...batch,
                        photos: batch.photos.filter(photo => !selectedPhotos.includes(photo.id))
                    };
                    setBatch(updatedBatch);
                }
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

    // 上传照片
    const handleUploadPhotos = async (values: any) => {
        if (!batch || fileList.length === 0) {
            message.error('请选择要上传的图片');
            return;
        }

        setUploading(true);
        try {
            const newPhotos = fileList.map((file, index) => ({
                id: Date.now().toString() + index,
                file,
                title: `照片 ${index + 1}`,
                description: '',
                tags: [],
                date: batch.date,
                friendName: batch.friendName,
                friendFullName: batch.friendFullName,
                phoneTail: batch.phoneTail
            }));

            const success = await PhotographyController.uploadPhotosToSession(batch.id, newPhotos, batch);

            if (success) {
                const newPhotoObjects = newPhotos.map(p => ({
                    id: p.id,
                    url: URL.createObjectURL(p.file.originFileObj as Blob),
                    thumbnail: URL.createObjectURL(p.file.originFileObj as Blob),
                    title: p.title,
                    description: p.description,
                    tags: p.tags,
                    date: p.date,
                    sessionId: batch.id,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                if (batch) {
                    const updatedBatch = {
                        ...batch,
                        photos: [...batch.photos, ...newPhotoObjects]
                    };
                    setBatch(updatedBatch);
                }

                setFileList([]);
                form.resetFields();
                setShowUploadModal(false);
                message.success('照片上传成功！');
            } else {
                message.error('上传失败，请重试');
            }
        } catch (error) {
            message.error('上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    // 上传组件配置
    const uploadProps: UploadProps = {
        fileList,
        maxCount: 100,
        multiple: true,
        accept: "image/*",
        beforeUpload: () => false,
        onChange: ({ fileList: newFileList }) => {
            const validFiles = newFileList.filter(file => {
                if (file.originFileObj) {
                    const validation = PhotographyController.validateImageFile(file.originFileObj);
                    if (!validation.isValid) {
                        message.error(`${file.name}: ${validation.message || '文件验证失败'}`);
                        return false;
                    }
                }
                return true;
            });
            setFileList(validFiles);
        },
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        }
    };

    // 如果正在加载，显示加载状态
    if (loading) {
        return <div>加载中...</div>;
    }

    // 如果没有批次数据，显示错误
    if (!batch) {
        return <div>批次不存在或加载失败</div>;
    }

    return (
        <Layout>
            <div className="batch-view">
                {/* 页面标题 - 与批次列表页面保持一致 */}
                <div className="page-header">
                    <Title level={2}>
                        <FolderOutlined /> 底片管理
                    </Title>
                    <Tag color="purple" icon={<CrownOutlined />}>
                        meng模式
                    </Tag>
                </div>

                {/* 返回按钮和批次信息 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBackToBatches}
                        >
                            返回批次列表
                        </Button>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '20px' }}>
                        <Title level={3} style={{ marginTop: 0, marginBottom: '16px', textAlign: 'right' }}>
                            <FolderOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            {batch.batchName || `${batch.friendName} 的拍摄批次`}
                        </Title>
                        <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '8px', 
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            marginBottom: batch.description ? '16px' : '0'
                        }}>
                            <Tag color="blue" icon={<UserOutlined />}>
                                {batch.friendName}
                            </Tag>
                            {batch.friendFullName && (
                                <Tag color="default">
                                    {batch.friendFullName}
                                </Tag>
                            )}
                            <Tag color="purple" icon={<CalendarOutlined />}>
                                {batch.date ? moment(batch.date).format('YYYY-MM-DD') : '未知日期'}
                            </Tag>
                            {batch.location && (
                                <Tag color="geekblue">
                                    📍 {batch.location}
                                </Tag>
                            )}
                            <Tag color={batch.isPublic ? 'green' : 'orange'}>
                                {batch.isPublic ? '公开' : '私密'}
                            </Tag>
                        </div>
                        {batch.description && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: '#666',
                                borderLeft: '3px solid #1890ff',
                                textAlign: 'left'
                            }}>
                                <Text strong>拍摄描述：</Text> {batch.description}
                            </div>
                        )}
                    </div>
                </div>

                {/* 批次信息编辑面板 - 可收起展开 */}
                <Collapse
                    activeKey={batchEditActive}
                    onChange={setBatchEditActive}
                    size="small"
                    style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px'
                    }}
                    items={[
                        {
                            key: '1',
                            label: (
                                <Space>
                                    <EditOutlined style={{ fontSize: '15px', color: '#595959' }} />
                                    <span style={{ color: '#595959', fontSize: '14px' }}>批次信息编辑</span>
                                </Space>
                            ),
                            children: (
                                <>
                                    <Form
                                        form={detailEditForm}
                                        layout="vertical"
                                        onFinish={handleUpdateBatchInDetail}
                                    >
                                        {/* 拍摄批次名称 - 第一行 */}
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
                                                            detailEditForm.setFieldsValue({ friendFullName: pinyin });
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
                                                    <DatePicker style={{ width: '100%' }} placeholder="请选择新的拍摄日期" />
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
                                        {/* 详细设置字段 - 使用Collapse收起 */}
                                        <Collapse
                                            defaultActiveKey={[]}
                                            size="small"
                                            style={{
                                                marginTop: 16
                                            }}
                                            items={[
                                                {
                                                    key: '1',
                                                    label: (
                                                        <Space>
                                                            <SettingOutlined style={{ fontSize: '14px', color: '#8c8c8c' }} />
                                                            <span style={{ color: '#8c8c8c', fontSize: '14px' }}>详细设置</span>
                                                        </Space>
                                                    ),
                                                    children: (
                                                        <div>
                                                            {/* 分类信息 */}
                                                            <Divider orientation="left">🏷️ 分类信息</Divider>

                                                            <Form.Item
                                                                name="tags"
                                                                label="标签"
                                                            >
                                                                <Select
                                                                    mode="tags"
                                                                    placeholder="选择或输入标签"
                                                                    style={{ width: '100%' }}
                                                                >
                                                                    {PRESET_TAGS.map(tag => (
                                                                        <Option key={tag} value={tag}>{tag}</Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>

                                                            <Row gutter={16}>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="isFeatured"
                                                                        label="是否精选"
                                                                        valuePropName="checked"
                                                                    >
                                                                        <Switch />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="sortOrder"
                                                                        label="排序权重"
                                                                    >
                                                                        <InputNumber
                                                                            placeholder="0"
                                                                            min={0}
                                                                            max={999}
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>

                                                            {/* 拍摄详情 */}
                                                            <Divider orientation="left">📝 拍摄详情（选填）</Divider>

                                                            <Form.Item
                                                                name="theme"
                                                                label="拍摄主题"
                                                            >
                                                                <Input
                                                                    placeholder="如：春日樱花人像、咖啡厅文艺风等"
                                                                    maxLength={100}
                                                                    showCount
                                                                />
                                                            </Form.Item>

                                                            {/* 设备信息 */}
                                                            <Divider orientation="left">📷 设备信息（选填）</Divider>

                                                            <Row gutter={16}>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="camera"
                                                                        label="相机型号"
                                                                    >
                                                                        <Input placeholder="如：Canon EOS R5" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="lens"
                                                                        label="镜头型号"
                                                                    >
                                                                        <Input placeholder="如：85mm f/1.4" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>

                                                            <Row gutter={16}>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="aperture"
                                                                        label="光圈"
                                                                    >
                                                                        <Input placeholder="如：f/1.4" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="shutterSpeed"
                                                                        label="快门速度"
                                                                    >
                                                                        <Input placeholder="如：1/200s" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>

                                                            <Row gutter={16}>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="iso"
                                                                        label="ISO值"
                                                                    >
                                                                        <Input placeholder="如：100" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="focalLength"
                                                                        label="焦距"
                                                                    >
                                                                        <Input placeholder="如：85mm" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>

                                                            {/* 环境信息 */}
                                                            <Divider orientation="left">🌤️ 环境信息（选填）</Divider>

                                                            <Row gutter={16}>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="weather"
                                                                        label="天气条件"
                                                                    >
                                                                        <Input placeholder="如：晴天、阴天、雨天等" />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={12}>
                                                                    <Form.Item
                                                                        name="lighting"
                                                                        label="光线条件"
                                                                    >
                                                                        <Input placeholder="如：自然光、人工光、混合光等" />
                                                                    </Form.Item>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    )
                                                }
                                            ]}
                                        />

                                        <Form.Item style={{ marginTop: 16 }}>
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    icon={<SaveOutlined />}
                                                >
                                                    保存修改
                                                </Button>
                                                <Button onClick={() => detailEditForm.resetFields()}>
                                                    重置
                                                </Button>
                                                <Button
                                                    onClick={() => setBatchEditActive([])}
                                                    icon={<UpOutlined />}
                                                >
                                                    收起面板
                                                </Button>
                                            </Space>
                                        </Form.Item>

                                    </Form>
                                </>
                            )
                        }
                    ]}
                />


                {/* 批次照片展示和管理 */}
                <div className="photos-section">
                    <div className="photos-header" style={{ display: 'flex', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0, marginRight: 'auto' }}>批次照片 ({batch.photos.length} 张)</Title>
                        <Space>
                            <Button
                                type={isDeleteMode ? 'primary' : 'default'}
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    setIsDeleteMode(!isDeleteMode);
                                    if (isDeleteMode) {
                                        setSelectedPhotos([]);
                                    }
                                }}
                            >
                                {isDeleteMode ? '退出删除模式' : '选择删除'}
                            </Button>
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => setShowUploadModal(true)}
                            >
                                批量上传
                            </Button>
                            {isDeleteMode && selectedPhotos.length > 0 && (
                                <Button
                                    type="primary"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleBatchDeletePhotos}
                                >
                                    删除选中 ({selectedPhotos.length})
                                </Button>
                            )}
                        </Space>
                    </div>

                    {batch.photos.length === 0 ? (
                        <Empty description="该批次暂无照片" />
                    ) : (
                        <Row className="photos-grid" gutter={[16, 16]}>
                            {batch.photos.map(photo => (
                                <Col xs={24} sm={12} lg={8} xl={6} key={photo.id}>
                                    <Card
                                        hoverable
                                        style={{
                                            cursor: isDeleteMode ? 'pointer' : 'default',
                                            border: isDeleteMode && selectedPhotos.includes(photo.id) ? '2px solid #1890ff' : undefined,
                                            position: 'relative'
                                        }}
                                        onClick={() => handleTogglePhotoSelection(photo.id)}
                                        cover={
                                            <div style={{ position: 'relative' }}>
                                                <Image
                                                    alt="照片"
                                                    src={photo.thumbnail}
                                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                                    style={{ height: 150, objectFit: 'cover' }}
                                                />
                                                {isDeleteMode && selectedPhotos.includes(photo.id) && (
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
                                            title={`照片 ${photo.id}`}
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
                    )}
                </div>
            </div>
            {/* 批量上传弹窗 */}
            <Modal
                title={
                    <Space>
                        <UploadOutlined />
                        批量上传照片
                    </Space>
                }
                open={showUploadModal}
                onCancel={() => setShowUploadModal(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUploadPhotos}
                >
                    <Form.Item
                        name="photos"
                        label="选择照片"
                        rules={[{ required: true, message: '请选择要上传的照片' }]}
                        extra="支持一次选择多张图片，最多100张"
                    >
                        <Upload {...uploadProps} listType="picture-card">
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>选择照片</div>
                                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>支持多选</div>
                            </div>
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={uploading}
                                icon={<UploadOutlined />}
                            >
                                上传照片
                            </Button>
                            <Button onClick={() => setShowUploadModal(false)}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    )
}



