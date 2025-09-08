// import React, { useState, useContext, useEffect } from "react";
// import { useSearchParams, useNavigate, useParams } from "react-router-dom";
// import Layout from "../../common/Layout";
// import pinyin from "pinyin";
// import moment from "moment";
// import { createNavigateWithMeng } from "../../../utils/navigation";
// import {
//   Card,
//   Typography,
//   Button,
//   Space,
//   Input,
//   message,
//   Row,
//   Col,
//   Image,
//   Tag,
//   Modal,
//   Form,
//   DatePicker,
//   Upload,
//   Select,
//   Divider,
//   List,
//   Popconfirm,
//   Empty,
//   Collapse,
//   Switch,
//   InputNumber
// } from "antd";

// import {
//   UploadOutlined,
//   CameraOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   CrownOutlined,
//   SaveOutlined,
//   FolderOutlined,
//   EyeOutlined,
//   EditOutlined,
//   ArrowLeftOutlined,
//   UserOutlined,
//   CalendarOutlined,
//   SettingOutlined,
//   UpOutlined,
//   DownOutlined,
//   RightOutlined
// } from "@ant-design/icons";
// import { mengsBlogContext } from "../../common/Layout";
// import { PhotographyController } from "../Controller";
// import { PhotoUpload, PhotoSession, Photo, PRESET_TAGS } from "../Model";
// import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
// import "../../../css/photography/uploadPhotos.css";

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const PhotographyManagement = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const params = useParams();
//   const { blogCommonStore } = useContext(mengsBlogContext) as any;
//   const [form] = Form.useForm();
//   const [batchForm] = Form.useForm();
//   const [editBatchForm] = Form.useForm();
//   const [detailEditForm] = Form.useForm();

//   // 使用pinyin包生成拼音
//   const generatePinyin = (chineseName: string): string => {
//     if (!chineseName) return '';

//     try {
//       // 使用pinyin包，设置style为NORMAL（不带声调）
//       const result = pinyin(chineseName, {
//         style: pinyin.STYLE_NORMAL
//       });

//       // 将二维数组扁平化并连接
//       return result.flat().join('').toLowerCase();
//     } catch (error) {
//       console.error('拼音生成失败:', error);
//       return chineseName; // 如果失败，返回原字符串
//     }
//   };

//   // 检查是否为 Meng 模式
//   const isMeng = searchParams.get('meng') === 'true';

//   // 权限检查：如果不是meng模式，显示权限不足页面
//   if (!isMeng) {
//     return (
//       <Layout>
//         <div className="photo-management">
//           <div className="page-header" style={{ marginBottom: 12 }}>
//             <Title level={2}>
//               <FolderOutlined /> 底片管理
//             </Title>
//           </div>

//           <div style={{
//             textAlign: 'center',
//             padding: '60px 20px',
//             background: '#f8f9fa',
//             borderRadius: '8px',
//             margin: '20px 0'
//           }}>
//             <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
//             <Title level={3} style={{ color: '#666' }}>权限不足</Title>
//             <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '20px' }}>
//               此页面需要管理员权限才能访问
//             </Text>
//             <Button
//               type="primary"
//               onClick={() => window.location.href = '/photography'}
//               icon={<ArrowLeftOutlined />}
//             >
//               返回摄影页面
//             </Button>
//           </div>
//         </div>
//       </Layout>
//     );
//   }



//   // 状态管理
//   const [photoSessions, setPhotoSessions] = useState<PhotoSession[]>([]);
//   const [currentSession, setCurrentSession] = useState<PhotoSession | null>(null);
//   const [showBatchModal, setShowBatchModal] = useState(false);
//   const [showPhotoModal, setShowPhotoModal] = useState(false);
//   const [showEditBatchModal, setShowEditBatchModal] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [showRetouchedUploadModal, setShowRetouchedUploadModal] = useState(false);
//   const [isDeleteMode, setIsDeleteMode] = useState(false);
//   const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
//   const [uploading, setUploading] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState<UploadFile[]>([]);
//   const [viewingBatch, setViewingBatch] = useState<PhotoSession | null>(null);
//   const [batchEditActive, setBatchEditActive] = useState<string[]>([]);

//   // 组件加载时获取所有批次
//   useEffect(() => {
//     fetchPhotoSessions();
//   }, []); // 只在组件挂载时执行一次

//   // 当URL参数变化时，自动加载对应的批次详情
//   useEffect(() => {
//     if (params.batchId && photoSessions.length > 0) {
//       const targetSession = photoSessions.find(s => s.id === params.batchId);
//       if (targetSession) {
//         // 简单设置批次信息，避免复杂的异步操作
//         setViewingBatch(targetSession);
//         setCurrentSession(targetSession);
//         setIsDeleteMode(false);
//         setSelectedPhotos([]);
//       }
//     }
//   }, [params.batchId, photoSessions]);

//   // 当viewingBatch变化时，为详情页面的编辑表单设置初始值
//   useEffect(() => {
//     if (viewingBatch && detailEditForm) {
//       detailEditForm.setFieldsValue({
//         friendName: viewingBatch.friendName,
//         friendFullName: viewingBatch.friendFullName,
//         phoneTail: viewingBatch.phoneTail,
//         isPublic: viewingBatch.isPublic,
//         batchName: viewingBatch.batchName,
//         location: viewingBatch.location,
//         description: viewingBatch.description,
//         // 日期字段需要转换为 moment 对象
//         date: viewingBatch.date ? moment(viewingBatch.date) : undefined,
//         // 新增字段
//         tags: viewingBatch.tags,
//         isFeatured: viewingBatch.isFeatured,
//         sortOrder: viewingBatch.sortOrder,
//         theme: viewingBatch.theme,
//         camera: viewingBatch.camera,
//         lens: viewingBatch.lens,
//         aperture: viewingBatch.aperture,
//         shutterSpeed: viewingBatch.shutterSpeed,
//         iso: viewingBatch.iso,
//         focalLength: viewingBatch.focalLength,
//         weather: viewingBatch.weather,
//         lighting: viewingBatch.lighting
//       });
//     }
//   }, [viewingBatch, detailEditForm]);

//   // 获取所有照片批次
//   const fetchPhotoSessions = async () => {
//     setLoading(true);
//     try {
//       const sessions = await PhotographyController.getAllPhotoSessions();
//       console.log("sessions====>", sessions);
//       setPhotoSessions(sessions);
//     } catch (error) {
//       console.error('获取照片批次失败:', error);
//       message.error('获取照片批次失败');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 创建新批次
//   const handleCreateBatch = async (values: any) => {
//     try {
//       // 自动生成姓名全拼
//       const friendFullName = generatePinyin(values.friendName);

//       const newSession = await PhotographyController.createPhotoSession({
//         date: values.date.format('YYYY-MM-DD'),
//         friendName: values.friendName,
//         friendFullName: friendFullName,
//         phoneTail: values.phoneTail,
//         isPublic: values.isPublic || false,
//         batchName: values.batchName || undefined,
//         location: values.location || undefined,
//         description: values.description || undefined,
//         // 新增字段
//         tags: values.tags || undefined,
//         isFeatured: values.isFeatured || false,
//         sortOrder: values.sortOrder || 0,
//         theme: values.theme || undefined,
//         camera: values.camera || undefined,
//         lens: values.lens || undefined,
//         aperture: values.aperture || undefined,
//         shutterSpeed: values.shutterSpeed || undefined,
//         iso: values.iso || undefined,
//         focalLength: values.focalLength || undefined,
//         weather: values.weather || undefined,
//         lighting: values.lighting || undefined
//       });

//       if (newSession) {
//         setPhotoSessions(prev => [...prev, newSession]);
//         setShowBatchModal(false);
//         batchForm.resetFields();
//         message.success('批次创建成功！');
//       }
//     } catch (error) {
//       message.error('创建批次失败，请重试');
//     }
//   };

//   // 删除批次
//   const handleDeleteBatch = async (sessionId: string) => {
//     try {
//       const success = await PhotographyController.deletePhotoSession(sessionId);
//       if (success) {
//         setPhotoSessions(prev => prev.filter(session => session.id !== sessionId));
//         message.success('批次删除成功！');
//       } else {
//         message.error('删除失败，请重试');
//       }
//     } catch (error) {
//       message.error('删除失败，请重试');
//     }
//   };

//   // 通用导航函数，自动保持meng参数
//   const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);

//   // 进入批次详情
//   const handleEnterBatch = (session: PhotoSession) => {
//     navigateWithMeng(`/photography/batch/${session.id}`);
//   };

//   // 选择/取消选择照片
//   const handleTogglePhotoSelection = (photoId: string) => {
//     if (!isDeleteMode) return;

//     setSelectedPhotos(prev => {
//       if (prev.includes(photoId)) {
//         return prev.filter(id => id !== photoId);
//       } else {
//         return [...prev, photoId];
//       }
//     });
//   };

//   // 批量删除选中的照片
//   const handleBatchDeletePhotos = async () => {
//     if (selectedPhotos.length === 0) {
//       message.warning('请先选择要删除的照片');
//       return;
//     }

//     try {
//       // 使用批量删除接口
//       const result = await PhotographyController.deletePhotos(selectedPhotos);

//       if (result.success && result.deletedCount > 0) {
//         // 更新当前查看的批次
//         if (viewingBatch) {
//           const updatedViewingBatch = {
//             ...viewingBatch,
//             photos: viewingBatch.photos.filter(photo => !selectedPhotos.includes(photo.id))
//           };
//           setViewingBatch(updatedViewingBatch);
//         }

//         // 更新批次列表
//         setPhotoSessions(prev => prev.map(s =>
//           s.id === viewingBatch?.id ? { ...s, photos: s.photos.filter(photo => !selectedPhotos.includes(photo.id)) } : s
//         ));

//         setSelectedPhotos([]);
//         setIsDeleteMode(false);

//         if (result.failedIds.length > 0) {
//           message.warning(`成功删除 ${result.deletedCount} 张照片，${result.failedIds.length} 张删除失败`);
//         } else {
//           message.success(`成功删除 ${result.deletedCount} 张照片`);
//         }
//       } else {
//         message.error('删除失败，请重试');
//       }
//     } catch (error) {
//       message.error('删除失败，请重试');
//     }
//   };

//   // 编辑批次信息
//   const handleEditBatch = (session: PhotoSession) => {
//     setCurrentSession(session);
//     setShowEditBatchModal(true);

//     // 设置编辑表单的初始值
//     editBatchForm.setFieldsValue({
//       friendName: session.friendName,
//       friendFullName: session.friendFullName,
//       phoneTail: session.phoneTail,
//       isPublic: session.isPublic,
//       batchName: session.batchName,
//       location: session.location,
//       description: session.description,
//       // 日期字段需要转换为 moment 对象
//       date: session.date ? moment(session.date) : undefined,
//       // 新增字段
//       tags: session.tags,
//       isFeatured: session.isFeatured,
//       sortOrder: session.sortOrder,
//       theme: session.theme,
//       camera: session.camera,
//       lens: session.lens,
//       aperture: session.aperture,
//       shutterSpeed: session.shutterSpeed,
//       iso: session.iso,
//       focalLength: session.focalLength,
//       weather: session.weather,
//       lighting: session.lighting
//     });
//   };

//   // 返回批次列表
//   const handleBackToBatches = () => {
//     setViewingBatch(null);
//     setCurrentSession(null);
//     setFileList([]);
//     navigate('/photography/management');
//   };

//   // 更新批次信息
//   const handleUpdateBatch = async (values: any) => {
//     if (!currentSession) return;

//     try {
//       // 确保姓名全拼有值，如果没有则自动生成
//       let friendFullName = values.friendFullName;
//       if (!friendFullName && values.friendName) {
//         friendFullName = generatePinyin(values.friendName);
//       }

//       const updatedSession = await PhotographyController.updatePhotoSession(currentSession.id, {
//         date: values.date.format('YYYY-MM-DD'),
//         friendName: values.friendName,
//         friendFullName: friendFullName,
//         phoneTail: values.phoneTail,
//         isPublic: values.isPublic || false,
//         batchName: values.batchName || undefined,
//         location: values.location || undefined,
//         description: values.description || undefined,
//         // 新增字段
//         tags: values.tags || undefined,
//         isFeatured: values.isFeatured || false,
//         sortOrder: values.sortOrder || 0,
//         theme: values.theme || undefined,
//         camera: values.camera || undefined,
//         lens: values.lens || undefined,
//         aperture: values.aperture || undefined,
//         shutterSpeed: values.shutterSpeed || undefined,
//         iso: values.iso || undefined,
//         focalLength: values.focalLength || undefined,
//         weather: values.weather || undefined,
//         lighting: values.lighting || undefined
//       });

//       if (updatedSession) {
//         // 更新批次列表
//         setPhotoSessions(prev => prev.map(s =>
//           s.id === currentSession.id ? updatedSession : s
//         ));

//         // 如果当前正在查看这个批次，也要更新
//         if (viewingBatch?.id === currentSession.id) {
//           setViewingBatch(updatedSession);
//         }

//         setShowEditBatchModal(false);
//         editBatchForm.resetFields();
//         message.success('批次信息更新成功！');
//       }
//     } catch (error) {
//       message.error('更新批次失败，请重试');
//     }
//   };

//   // 在批次详情页面中更新批次信息
//   const handleUpdateBatchInDetail = async (values: any) => {
//     if (!viewingBatch) return;

//     try {
//       // 确保姓名全拼有值，如果没有则自动生成
//       let friendFullName = values.friendFullName;
//       if (!friendFullName && values.friendName) {
//         friendFullName = generatePinyin(values.friendName);
//       }

//       const updatedSession = await PhotographyController.updatePhotoSession(viewingBatch.id, {
//         date: values.date.format('YYYY-MM-DD'),
//         friendName: values.friendName,
//         friendFullName: friendFullName,
//         phoneTail: values.phoneTail,
//         isPublic: values.isPublic || false,
//         batchName: values.batchName || undefined,
//         location: values.location || undefined,
//         description: values.description || undefined,
//         // 新增字段
//         tags: values.tags || undefined,
//         isFeatured: values.isFeatured || false,
//         sortOrder: values.sortOrder || 0,
//         theme: values.theme || undefined,
//         camera: values.camera || undefined,
//         lens: values.lens || undefined,
//         aperture: values.aperture || undefined,
//         shutterSpeed: values.shutterSpeed || undefined,
//         iso: values.iso || undefined,
//         focalLength: values.focalLength || undefined,
//         weather: values.weather || undefined,
//         lighting: values.lighting || undefined
//       });

//       if (updatedSession) {
//         // 更新批次列表
//         setPhotoSessions(prev => prev.map(s =>
//           s.id === viewingBatch.id ? updatedSession : s
//         ));

//         // 更新当前查看的批次
//         setViewingBatch(updatedSession);

//         // 重置表单
//         detailEditForm.resetFields();
//         message.success('批次信息更新成功！');
//       }
//     } catch (error) {
//       message.error('更新批次失败，请重试');
//     }
//   };

//   // 上传照片到批次
//   const handleUploadPhotos = async (values: any) => {
//     const targetSession = viewingBatch || currentSession;
//     if (!targetSession || fileList.length === 0) {
//       message.error('请选择要上传的图片');
//       return;
//     }

//     setUploading(true);

//     try {
//       const newPhotos: PhotoUpload[] = fileList.map((file, index) => ({
//         id: Date.now().toString() + index,
//         file,
//         title: `照片 ${index + 1}`,
//         description: '',
//         tags: [],
//         date: targetSession.date,
//         friendName: targetSession.friendName,
//         friendFullName: targetSession.friendFullName,
//         phoneTail: targetSession.phoneTail
//       }));

//       const success = await PhotographyController.uploadPhotosToSession(targetSession.id, newPhotos, targetSession);

//       if (success) {
//         // 创建新的照片对象
//         const newPhotoObjects = newPhotos.map(p => ({
//           id: p.id,
//           url: URL.createObjectURL(p.file.originFileObj as Blob),
//           thumbnail: URL.createObjectURL(p.file.originFileObj as Blob),
//           title: p.title,
//           description: p.description,
//           tags: p.tags,
//           date: p.date,
//           sessionId: targetSession.id,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString()
//         }));

//         // 更新当前查看的批次
//         if (viewingBatch) {
//           const updatedViewingBatch = {
//             ...viewingBatch,
//             photos: [...viewingBatch.photos, ...newPhotoObjects]
//           };
//           setViewingBatch(updatedViewingBatch);
//         }

//         // 更新批次列表
//         setPhotoSessions(prev => prev.map(s =>
//           s.id === targetSession.id ? { ...s, photos: [...s.photos, ...newPhotoObjects] } : s
//         ));

//         setFileList([]);
//         form.resetFields();
//         setShowUploadModal(false);
//         message.success('照片上传成功！');
//       } else {
//         message.error('上传失败，请重试');
//       }

//     } catch (error) {
//       message.error('上传失败，请重试');
//     } finally {
//       setUploading(false);
//     }
//   };

//   // 删除批次中的照片
//   const handleDeletePhoto = async (photoId: string) => {
//     const targetSession = viewingBatch || currentSession;
//     if (!targetSession) return;

//     try {
//       const success = await PhotographyController.deletePhoto(photoId);
//       if (success) {
//         // 更新当前查看的批次
//         if (viewingBatch) {
//           const updatedViewingBatch = {
//             ...viewingBatch,
//             photos: viewingBatch.photos.filter(photo => photo.id !== photoId)
//           };
//           setViewingBatch(updatedViewingBatch);
//         }

//         // 更新批次列表
//         setPhotoSessions(prev => prev.map(s =>
//           s.id === targetSession.id ? { ...s, photos: s.photos.filter(photo => photo.id !== photoId) } : s
//         ));

//         message.success('照片已删除');
//       } else {
//         message.error('删除失败，请重试');
//       }
//     } catch (error) {
//       message.error('删除失败，请重试');
//     }
//   };

//   // 上传组件配置
//   const uploadProps: UploadProps = {
//     fileList,
//     maxCount: 100,
//     multiple: true,
//     accept: "image/*",
//     beforeUpload: () => {
//       // 返回false阻止自动上传，但允许文件选择
//       return false;
//     },
//     onChange: ({ fileList: newFileList }) => {
//       // 过滤掉无效的文件
//       const validFiles = newFileList.filter(file => {
//         if (file.originFileObj) {
//           const validation = PhotographyController.validateImageFile(file.originFileObj);
//           if (!validation.isValid) {
//             message.error(`${file.name}: ${validation.message || '文件验证失败'}`);
//             return false;
//           }
//         }
//         return true;
//       });
//       setFileList(validFiles);
//     },
//     onRemove: (file) => {
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     }
//   };

//   return (
//     <Layout>
//       <div className="photo-management">
//         {/* 页面标题 */}
//         <div className="page-header" style={{ marginBottom: 12 }}>
//           <Title level={2}>
//             <FolderOutlined /> 底片管理
//           </Title>
//           {isMeng && (
//             <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 12 }}>
//               meng模式
//             </Tag>
//           )}
//         </div>

//         {/* 批次列表显示 */}
//         {!viewingBatch && (
//           <>
//             {/* 创建新批次按钮 */}
//             <div style={{ marginBottom: 16 }}>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => setShowBatchModal(true)}
//               >
//                 创建新批次
//               </Button>
//             </div>

//             {/* 批次列表 */}
//             <div>
//               <Title level={4}>拍摄批次列表 ({photoSessions.length} 个)</Title>
//               {loading ? (
//                 <div>加载中...</div>
//               ) : photoSessions.length === 0 ? (
//                 <Empty description="暂无拍摄批次" />
//               ) : (
//                 <Row gutter={[16, 16]}>
//                   {photoSessions.map(session => (
//                     <Col xs={24} sm={12} lg={9} xl={7} key={session.id}>
//                       <Card
//                         hoverable
//                         style={{ cursor: 'pointer' }}
//                         onClick={() => handleEnterBatch(session)}
//                         cover={
//                           session.representativePhoto?.thumbnailUrl || (session.photos && session.photos.length > 0) ? (
//                             <div style={{
//                               height: 150,
//                               position: 'relative',
//                               overflow: 'hidden',
//                               backgroundColor: '#f5f5f5'
//                             }}>
//                               {/* 代表性照片或主要照片 */}
//                               <Image
//                                 alt="批次封面"
//                                 src={session.representativePhoto?.thumbnailUrl || session.photos[0]?.thumbnail}
//                                 fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
//                                 style={{
//                                   width: '100%',
//                                   height: '100%',
//                                   objectFit: 'cover'
//                                 }}
//                               />
//                               {/* 显示数量文字 */}
//                               <div style={{
//                                 position: 'absolute',
//                                 bottom: '8px',
//                                 right: '8px',
//                                 backgroundColor: 'rgba(0, 0, 0, 0.8)',
//                                 color: 'white',
//                                 padding: '4px 8px',
//                                 borderRadius: '8px',
//                                 fontSize: '12px',
//                                 fontWeight: 'bold'
//                               }}>
//                                 {session.totalPhotos || session.photos.length} 张
//                               </div>
//                             </div>
//                           ) : (
//                             <div style={{
//                               height: 150,
//                               backgroundColor: '#f5f5f5',
//                               display: 'flex',
//                               alignItems: 'center',
//                               justifyContent: 'center',
//                               color: '#999'
//                             }}>
//                               <FolderOutlined style={{ fontSize: 32 }} />
//                             </div>
//                           )
//                         }
//                         actions={[
//                           <EditOutlined
//                             key="edit"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleEditBatch(session);
//                             }}
//                           />,
//                           <Popconfirm
//                             title="确定要删除这个批次吗？"
//                             onConfirm={(e) => {
//                               e?.stopPropagation();
//                               handleDeleteBatch(session.id);
//                             }}
//                             okText="确定"
//                             cancelText="取消"
//                           >
//                             <DeleteOutlined
//                               key="delete"
//                               style={{ color: '#ff4d4f' }}
//                               onClick={(e) => e.stopPropagation()}
//                             />
//                           </Popconfirm>
//                         ]}
//                       >
//                         <Card.Meta
//                           title={session.batchName || `${session.friendName} 的拍摄批次`}
//                           description={
//                             <div>
//                               {/* 标签行：所有标签在一行，自动换行 */}
//                               <div style={{ 
//                                 marginBottom: 8,
//                                 display: 'flex',
//                                 flexWrap: 'wrap',
//                                 gap: '6px',
//                                 alignItems: 'center'
//                               }}>
//                                 <Tag color="blue" icon={<UserOutlined />}>
//                                   {session.friendName}
//                                 </Tag>
//                                 <Tag color="purple" icon={<CalendarOutlined />}>
//                                   {session.date ? moment(session.date).format('YYYY-MM-DD') : '未知日期'}
//                                 </Tag>
//                                 {session.location && (
//                                   <Tag color="geekblue">
//                                     📍 {session.location}
//                                   </Tag>
//                                 )}
//                                 <Tag color={session.isPublic ? 'green' : 'orange'}>
//                                   {session.isPublic ? '公开' : '私密'}
//                                 </Tag>
//                               </div>
//                               {session.description && (
//                                 <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
//                                   {session.description}
//                                 </div>
//                               )}
//                               <div style={{ fontSize: '12px', color: '#999' }}>
//                                 照片数量: {session.totalPhotos || session.photos.length} 张
//                               </div>
//                             </div>
//                           }
//                         />
//                       </Card>
//                     </Col>
//                   ))}
//                 </Row>
//               )}
//             </div>
//           </>
//         )}

//         {/* 编辑批次弹窗 */}
//         <Modal
//           title={
//             <Space>
//               <EditOutlined />
//               编辑拍摄批次
//             </Space>
//           }
//           open={showEditBatchModal}
//           onCancel={() => setShowEditBatchModal(false)}
//           footer={null}
//           width={500}
//         >
//           {currentSession && (
//             <Form
//               form={editBatchForm}
//               layout="vertical"
//               onFinish={handleUpdateBatch}
//             >
//               {/* 拍摄批次名称 - 第一排，虽然不是必填但很重要 */}
//               <Form.Item
//                 name="batchName"
//                 label="拍摄批次名称"
//               >
//                 <Input placeholder="如：春日樱花人像拍摄" />
//               </Form.Item>

//               {/* 客户姓名和姓名全拼 - 第二行 */}
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="friendName"
//                     label="客户姓名"
//                     rules={[{ required: true, message: '请输入客户姓名' }]}
//                   >
//                     <Input
//                       placeholder="如：张伟"
//                       onChange={(e) => {
//                         // 自动生成姓名全拼
//                         const pinyin = generatePinyin(e.target.value);
//                         editBatchForm.setFieldsValue({ friendFullName: pinyin });
//                       }}
//                     />
//                   </Form.Item>
//                 </Col>
//                 <Col span={12}>
//                   <Form.Item
//                     name="friendFullName"
//                     label=" "
//                   >
//                     <Input
//                       placeholder="自动生成"
//                       readOnly
//                       style={{ backgroundColor: '#f5f5f5' }}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>

//               {/* 拍摄日期和手机尾号 - 第三行 */}
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="date"
//                     label="拍摄日期"
//                     rules={[{ required: true, message: '请选择拍摄日期' }]}
//                   >
//                     <DatePicker style={{ width: '100%' }} placeholder="请选择新的拍摄日期" />
//                   </Form.Item>
//                 </Col>
//                 <Col span={12}>
//                   <Form.Item
//                     name="phoneTail"
//                     label="手机尾号"
//                     rules={[{ required: true, message: '请输入手机尾号' }]}
//                   >
//                     <Input placeholder="如：1234" />
//                   </Form.Item>
//                 </Col>
//               </Row>

//               {/* 基本设置字段 */}
//               <Form.Item
//                 name="isPublic"
//                 label="可见性"
//                 extra="控制后端是否返回该批次数据，不影响密码验证"
//               >
//                 <Select placeholder="选择可见性">
//                   <Option value={false}>私密（后端不返回）</Option>
//                   <Option value={true}>公开（后端返回）</Option>
//                 </Select>
//               </Form.Item>

//               <Form.Item
//                 name="location"
//                 label="拍摄地点"
//               >
//                 <Input placeholder="如：樱花公园、咖啡厅等" />
//               </Form.Item>

//               <Form.Item
//                 name="description"
//                 label="拍摄描述"
//               >
//                 <TextArea
//                   placeholder="拍摄主题、风格、特殊要求等描述信息"
//                   rows={3}
//                   maxLength={100}
//                   showCount
//                 />
//               </Form.Item>

//               <Form.Item style={{ marginTop: 24 }}>
//                 <Space>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     icon={<SaveOutlined />}
//                   >
//                     保存修改
//                   </Button>
//                   <Button onClick={() => setShowEditBatchModal(false)}>
//                     取消
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           )}
//         </Modal>

//         {/* 创建批次弹窗 */}
//         <Modal
//           title={
//             <Space>
//               <FolderOutlined />
//               创建新拍摄批次
//             </Space>
//           }
//           open={showBatchModal}
//           onCancel={() => setShowBatchModal(false)}
//           footer={null}
//           width={500}
//         >
//           <Form
//             form={batchForm}
//             layout="vertical"
//             onFinish={handleCreateBatch}
//           >
//             {/* 拍摄批次名称 - 第一排，虽然不是必填但很重要 */}
//             <Form.Item
//               name="batchName"
//               label="拍摄批次名称"
//             >
//               <Input placeholder="如：春日樱花人像拍摄" />
//             </Form.Item>

//             {/* 客户姓名和姓名全拼 - 第二行 */}
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="friendName"
//                   label="客户姓名"
//                   rules={[{ required: true, message: '请输入客户姓名' }]}
//                 >
//                   <Input
//                     placeholder="如：张伟"
//                     onChange={(e) => {
//                       // 自动生成姓名全拼
//                       const pinyin = generatePinyin(e.target.value);
//                       batchForm.setFieldsValue({ friendFullName: pinyin });
//                     }}
//                   />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item
//                   name="friendFullName"
//                   label=" "
//                 >
//                   <Input
//                     placeholder="自动生成"
//                     readOnly
//                     style={{ backgroundColor: '#f5f5f5' }}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             {/* 拍摄日期和手机尾号 - 第三行 */}
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item
//                   name="date"
//                   label="拍摄日期"
//                   rules={[{ required: true, message: '请选择拍摄日期' }]}
//                 >
//                   <DatePicker style={{ width: '100%' }} />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item
//                   name="phoneTail"
//                   label="手机尾号"
//                   rules={[{ required: true, message: '请输入手机尾号' }]}
//                 >
//                   <Input placeholder="如：1234" />
//                 </Form.Item>
//               </Col>
//             </Row>

//             <Form.Item
//               name="isPublic"
//               label="可见性"
//               extra="控制后端是否返回该批次数据，不影响密码验证"
//             >
//               <Select placeholder="选择可见性">
//                 <Option value={false}>私密（后端不返回）</Option>
//                 <Option value={true}>公开（后端返回）</Option>
//               </Select>
//             </Form.Item>

//             {/* 其他可选字段 */}
//             <Form.Item
//               name="location"
//               label="拍摄地点"
//             >
//               <Input placeholder="如：樱花公园、咖啡厅等" />
//             </Form.Item>

//             <Form.Item
//               name="description"
//               label="描述信息"
//             >
//               <TextArea
//                 placeholder="拍摄主题、风格、特殊要求等描述信息"
//                 rows={3}
//                 maxLength={100}
//                 showCount
//               />
//             </Form.Item>

//             <Form.Item style={{ marginTop: 24 }}>
//               <Space>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   icon={<SaveOutlined />}
//                 >
//                   创建批次
//                 </Button>
//                 <Button onClick={() => setShowBatchModal(false)}>
//                   取消
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         </Modal>

//         {/* 批次详情显示 */}
//         {viewingBatch && (
//           <>
//             {/* 返回按钮和批次信息 */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//               <Button
//                 icon={<ArrowLeftOutlined />}
//                 onClick={handleBackToBatches}
//               >
//                 返回批次列表
//               </Button>
//               <div>
//                 <Title level={3}>
//                   <FolderOutlined style={{ marginRight: 8, color: '#1890ff' }} />
//                   {viewingBatch.batchName || `${viewingBatch.friendName} 的拍摄批次`}
//                 </Title>
//                 <div style={{ marginTop: 8 }}>
//                   <Tag color="blue" icon={<UserOutlined />}>
//                     {viewingBatch.friendName}
//                   </Tag>
//                   {viewingBatch.friendFullName && (
//                     <Tag color="default" style={{ marginLeft: 8 }}>
//                       {viewingBatch.friendFullName}
//                     </Tag>
//                   )}
//                   <Tag color="purple" icon={<CalendarOutlined />} style={{ marginLeft: 8 }}>
//                     {viewingBatch.date}
//                   </Tag>
//                   {viewingBatch.location && (
//                     <Tag color="geekblue" style={{ marginLeft: 8 }}>
//                       📍 {viewingBatch.location}
//                     </Tag>
//                   )}
//                   <Tag color={viewingBatch.isPublic ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
//                     {viewingBatch.isPublic ? '公开' : '私密'}
//                   </Tag>
//                 </div>
//                 {viewingBatch.description && (
//                   <div style={{
//                     marginTop: 8,
//                     padding: '12px',
//                     backgroundColor: '#f8f9fa',
//                     borderRadius: '6px',
//                     fontSize: '14px',
//                     color: '#666',
//                     borderLeft: '4px solid #1890ff'
//                   }}>
//                     <Text strong>拍摄描述：</Text> {viewingBatch.description}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* 批次信息编辑面板 */}
//             <Collapse
//               activeKey={batchEditActive}
//               onChange={setBatchEditActive}
//               size="small"
//               style={{
//                 border: '1px solid #f0f0f0',
//                 borderRadius: '6px',
//                 marginBottom: 16
//               }}
//               items={[
//                 {
//                   key: '1',
//                   label: (
//                     <Space>
//                       <EditOutlined style={{ fontSize: '15px', color: '#595959' }} />
//                       <span style={{ color: '#595959', fontSize: '14px' }}>批次信息编辑</span>
//                     </Space>
//                   ),
//                   children: (
//                     <Form
//                       form={detailEditForm}
//                       layout="vertical"
//                       onFinish={handleUpdateBatchInDetail}
//                     >
//                       {/* 拍摄批次名称 */}
//                       <Form.Item
//                         name="batchName"
//                         label="拍摄批次名称"
//                       >
//                         <Input placeholder="如：春日樱花人像拍摄" />
//                       </Form.Item>

//                       {/* 客户姓名和姓名全拼 */}
//                       <Row gutter={16}>
//                         <Col span={12}>
//                           <Form.Item
//                             name="friendName"
//                             label="客户姓名"
//                             rules={[{ required: true, message: '请输入客户姓名' }]}
//                           >
//                             <Input
//                               placeholder="如：张伟"
//                               onChange={(e) => {
//                                 const pinyin = generatePinyin(e.target.value);
//                                 detailEditForm.setFieldsValue({ friendFullName: pinyin });
//                               }}
//                             />
//                           </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                           <Form.Item
//                             name="friendFullName"
//                             label=" "
//                           >
//                             <Input
//                               placeholder="自动生成"
//                               readOnly
//                               style={{ backgroundColor: '#f5f5f5' }}
//                             />
//                           </Form.Item>
//                         </Col>
//                       </Row>

//                       {/* 拍摄日期和手机尾号 */}
//                       <Row gutter={16}>
//                         <Col span={12}>
//                           <Form.Item
//                             name="date"
//                             label="拍摄日期"
//                             rules={[{ required: true, message: '请选择拍摄日期' }]}
//                           >
//                             <DatePicker style={{ width: '100%' }} placeholder="请选择新的拍摄日期" />
//                           </Form.Item>
//                         </Col>
//                         <Col span={12}>
//                           <Form.Item
//                             name="phoneTail"
//                             label="手机尾号"
//                             rules={[{ required: true, message: '请输入手机尾号' }]}
//                           >
//                             <Input placeholder="如：1234" />
//                           </Form.Item>
//                         </Col>
//                       </Row>

//                       {/* 基本设置字段 */}
//                       <Form.Item
//                         name="isPublic"
//                         label="可见性"
//                         extra="控制后端是否返回该批次数据，不影响密码验证"
//                       >
//                         <Select placeholder="选择可见性">
//                           <Option value={false}>私密（后端不返回）</Option>
//                           <Option value={true}>公开（后端返回）</Option>
//                         </Select>
//                       </Form.Item>

//                       <Form.Item
//                         name="location"
//                         label="拍摄地点"
//                       >
//                         <Input placeholder="如：樱花公园、咖啡厅等" />
//                       </Form.Item>

//                       <Form.Item
//                         name="description"
//                         label="拍摄描述"
//                       >
//                         <TextArea
//                           placeholder="拍摄主题、风格、特殊要求等描述信息"
//                           rows={3}
//                           maxLength={100}
//                           showCount
//                         />
//                       </Form.Item>

//                       <Form.Item style={{ marginTop: 16 }}>
//                         <Space>
//                           <Button
//                             type="primary"
//                             htmlType="submit"
//                             icon={<SaveOutlined />}
//                           >
//                             保存修改
//                           </Button>
//                           <Button onClick={() => detailEditForm.resetFields()}>
//                             重置
//                           </Button>
//                           <Button
//                             onClick={() => setBatchEditActive([])}
//                             icon={<UpOutlined />}
//                           >
//                             收起面板
//                           </Button>
//                         </Space>
//                       </Form.Item>
//                     </Form>
//                   )
//                 }
//               ]}
//             />

//             {/* 批次照片展示和管理 */}
//             <div style={{ marginBottom: 12 }}>
//               <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, marginBottom: 16 }}>
//                 <Title level={4} style={{ margin: 0, marginRight: 'auto' }}>
//                   批次照片 ({viewingBatch.photos.length} 张)
//                   <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '16px' }}>
//                     <span style={{ color: '#52c41a' }}>●</span> 精修: {viewingBatch.photos.filter(p => p.isRetouched).length} 张
//                     <span style={{ marginLeft: '16px', color: '#666' }}>●</span> 原片: {viewingBatch.photos.filter(p => !p.isRetouched).length} 张
//                   </span>
//                 </Title>
//                 <Space>
//                   <Button
//                     type={isDeleteMode ? 'primary' : 'default'}
//                     icon={<DeleteOutlined />}
//                     onClick={() => {
//                       setIsDeleteMode(!isDeleteMode);
//                       if (isDeleteMode) {
//                         setSelectedPhotos([]);
//                       }
//                     }}
//                   >
//                     {isDeleteMode ? '退出删除模式' : '选择删除'}
//                   </Button>
//                   <Button
//                     type="primary"
//                     icon={<UploadOutlined />}
//                     onClick={() => setShowUploadModal(true)}
//                   >
//                     批量上传原片
//                   </Button>
//                   <Button
//                     type="primary"
//                     icon={<UploadOutlined />}
//                     onClick={() => setShowRetouchedUploadModal(true)}
//                     style={{ background: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     批量上传精修
//                   </Button>
//                   {isDeleteMode && selectedPhotos.length > 0 && (
//                     <Button
//                       type="primary"
//                       danger
//                       icon={<DeleteOutlined />}
//                       onClick={handleBatchDeletePhotos}
//                     >
//                       删除选中 ({selectedPhotos.length})
//                     </Button>
//                   )}
//                 </Space>
//               </div>

//               {viewingBatch.photos.length === 0 ? (
//                 <Empty description="该批次暂无照片" />
//               ) : (
//                 <Row gutter={[16, 16]}>
//                   {viewingBatch.photos.map(photo => (
//                     <Col xs={24} sm={12} lg={8} xl={6} key={photo.id}>
//                       <Card
//                         hoverable
//                         style={{
//                           cursor: isDeleteMode ? 'pointer' : 'default',
//                           border: isDeleteMode && selectedPhotos.includes(photo.id) ? '2px solid #1890ff' : undefined,
//                           position: 'relative'
//                         }}
//                         onClick={() => handleTogglePhotoSelection(photo.id)}
//                         cover={
//                           <div style={{ position: 'relative' }}>
//                             <Image
//                               alt="照片"
//                               src={photo.thumbnail}
//                               fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
//                               style={{ 
//                                 height: 150, 
//                                 objectFit: 'cover',
//                                 border: photo.isRetouched ? '2px solid #52c41a' : '1px solid #d9d9d9'
//                               }}
//                             />
//                             {photo.isRetouched && (
//                               <div
//                                 style={{
//                                   position: 'absolute',
//                                   top: 8,
//                                   left: 8,
//                                   background: 'rgba(82, 196, 26, 0.9)',
//                                   color: 'white',
//                                   padding: '4px 8px',
//                                   borderRadius: '4px',
//                                   fontSize: '12px',
//                                   fontWeight: 'bold'
//                                 }}
//                               >
//                                 ⭐ 精修
//                               </div>
//                             )}
//                             {isDeleteMode && selectedPhotos.includes(photo.id) && (
//                               <div
//                                 style={{
//                                   position: 'absolute',
//                                   top: 8,
//                                   right: 8,
//                                   width: 20,
//                                   height: 20,
//                                   borderRadius: '50%',
//                                   backgroundColor: '#1890ff',
//                                   display: 'flex',
//                                   alignItems: 'center',
//                                   justifyContent: 'center',
//                                   color: 'white',
//                                   fontSize: '12px',
//                                   fontWeight: 'bold'
//                                 }}
//                               >
//                                 ✓
//                               </div>
//                             )}
//                           </div>
//                         }
//                       >
//                         <Card.Meta
//                           title={`照片 ${photo.id}`}
//                           description={
//                             <div>
//                               <div style={{ marginTop: 8 }}>
//                                 {photo.tags && photo.tags.length > 0 && photo.tags.map(tag => (
//                                   <Tag key={tag} color="blue" style={{ fontSize: '12px', marginBottom: 4 }}>
//                                     {tag}
//                                   </Tag>
//                                 ))}
//                               </div>
//                             </div>
//                           }
//                         />
//                       </Card>
//                     </Col>
//                   ))}
//                 </Row>
//               )}
//             </div>
//           </>
//         )}

//         {/* 批次详情弹窗 */}
//         <Modal
//           title={
//             <Space>
//               <FolderOutlined />
//               {currentSession?.friendName} 的拍摄批次
//               <Tag color="blue">{currentSession?.date}</Tag>
//             </Space>
//           }
//           open={showPhotoModal}
//           onCancel={() => setShowPhotoModal(false)}
//           footer={null}
//           width={800}
//           style={{ top: 20 }}
//         >
//           {currentSession && (
//             <div>
//               {/* 上传新照片 */}
//               <div style={{ marginBottom: 24 }}>
//                 <Title level={4}>上传新照片</Title>
//                 <Form
//                   form={form}
//                   layout="vertical"
//                   onFinish={handleUploadPhotos}
//                   initialValues={{
//                     tags: [],
//                     title: ''
//                   }}
//                 >
//                   <Form.Item
//                     label="选择图片"
//                     required
//                   >
//                     <Upload {...uploadProps} listType="picture-card">
//                       <div>
//                         <PlusOutlined />
//                         <div style={{ marginTop: 8 }}>上传图片</div>
//                       </div>
//                     </Upload>
//                     <Text type="secondary">支持 JPG、PNG、TIFF 等格式，单个文件不超过 30MB，单次最多可上传 100 张照片</Text>
//                   </Form.Item>

//                   <Row gutter={16}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="title"
//                         label="照片标题"
//                       >
//                         <Input placeholder="请输入照片标题（可选）" />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="tags"
//                         label="标签"
//                       >
//                         <Select
//                           mode="tags"
//                           placeholder="选择或输入标签"
//                           style={{ width: '100%' }}
//                         >
//                           {PRESET_TAGS.map(tag => (
//                             <Option key={tag} value={tag}>{tag}</Option>
//                           ))}
//                         </Select>
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Form.Item
//                     name="description"
//                     label="照片描述"
//                   >
//                     <TextArea
//                       rows={2}
//                       placeholder="请输入照片描述（可选）"
//                       maxLength={200}
//                       showCount
//                     />
//                   </Form.Item>

//                   <Form.Item>
//                     <Button
//                       type="primary"
//                       htmlType="submit"
//                       loading={uploading}
//                       icon={<UploadOutlined />}
//                     >
//                       上传照片
//                     </Button>
//                   </Form.Item>
//                 </Form>
//               </div>

//               <Divider />

//               {/* 批次中的照片 */}
//               <div>
//                 <Title level={4}>批次照片 ({currentSession.photos.length} 张)</Title>
//                 {currentSession.photos.length === 0 ? (
//                   <Empty description="该批次暂无照片" />
//                 ) : (
//                   <Row gutter={[16, 16]}>
//                     {currentSession.photos.map(photo => (
//                       <Col xs={24} sm={12} lg={8} xl={6} key={photo.id}>
//                         <Card
//                           hoverable
//                           cover={
//                             <Image
//                               alt={photo.title}
//                               src={photo.thumbnail}
//                               fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
//                               style={{ height: 150, objectFit: 'cover' }}
//                             />
//                           }
//                           actions={[
//                             <Popconfirm
//                               title="确定要删除这张照片吗？"
//                               onConfirm={() => handleDeletePhoto(photo.id)}
//                               okText="确定"
//                               cancelText="取消"
//                             >
//                               <DeleteOutlined
//                                 key="delete"
//                                 style={{ color: '#ff4d4f' }}
//                               />
//                             </Popconfirm>
//                           ]}
//                         >
//                           <Card.Meta
//                             title={photo.title || '未命名照片'}
//                             description={
//                               <div>
//                                 {photo.description && <div>{photo.description}</div>}
//                                 <div style={{ marginTop: 8 }}>
//                                   {photo.tags.map(tag => (
//                                     <Tag key={tag} color="blue" style={{ fontSize: '12px' }}>
//                                       {tag}
//                                     </Tag>
//                                   ))}
//                                 </div>
//                               </div>
//                             }
//                           />
//                         </Card>
//                       </Col>
//                     ))}
//                   </Row>
//                 )}
//               </div>
//             </div>
//           )}
//         </Modal>

//         {/* 精修照片上传弹窗 */}
//         <Modal
//           title={
//             <Space>
//               <UploadOutlined />
//               批量上传精修照片
//             </Space>
//           }
//           open={showRetouchedUploadModal}
//           onCancel={() => {
//             setShowRetouchedUploadModal(false);
//             setFileList([]);
//             form.resetFields();
//           }}
//           footer={null}
//           width={800}
//         >
//           <div style={{ padding: '20px 0' }}>
//             <Form
//               form={form}
//               layout="vertical"
//               onFinish={async (values) => {
//                 if (fileList.length === 0) {
//                   message.warning('请选择要上传的照片');
//                   return;
//                 }

//                 setUploading(true);
//                 try {
//                   // 创建照片上传对象，标记为精修照片
//                   const photos: PhotoUpload[] = fileList.map((file, index) => ({
//                     id: `temp_${Date.now()}_${index}`,
//                     file,
//                     title: values.titles?.[index] || `精修照片_${index + 1}`,
//                     description: values.description || '',
//                     tags: values.tags || [],
//                     date: values.date || moment().format('YYYY-MM-DD'),
//                     friendName: viewingBatch?.friendName || '',
//                     friendFullName: viewingBatch?.friendFullName || '',
//                     phoneTail: viewingBatch?.phoneTail || '',
//                     isRetouched: true // 标记为精修照片
//                   }));

//                   const success = await PhotographyController.uploadPhotos(photos);
//                   if (success) {
//                     // 更新当前批次照片列表
//                     const newPhotoObjects = photos.map(photo => ({
//                       id: photo.id,
//                       url: URL.createObjectURL(photo.file.originFileObj!),
//                       thumbnail: URL.createObjectURL(photo.file.originFileObj!),
//                       title: photo.title,
//                       description: photo.description,
//                       tags: photo.tags,
//                       date: photo.date,
//                       sessionId: viewingBatch!.id,
//                       isRetouched: true, // 标记为精修照片
//                       createdAt: new Date().toISOString(),
//                       updatedAt: new Date().toISOString()
//                     }));

//                     setPhotoSessions(prev => prev.map(s => 
//                       s.id === viewingBatch!.id ? { ...s, photos: [...s.photos, ...newPhotoObjects] } : s
//                     ));

//                     setFileList([]);
//                     form.resetFields();
//                     setShowRetouchedUploadModal(false);
//                     message.success('精修照片上传成功！');
//                   } else {
//                     message.error('上传失败，请重试');
//                   }

//                 } catch (error) {
//                   message.error('上传失败，请重试');
//                 } finally {
//                   setUploading(false);
//                 }
//               }}
//             >
//               <Form.Item
//                 name="files"
//                 label="选择精修照片"
//                 rules={[{ required: true, message: '请选择要上传的精修照片' }]}
//               >
//                 <Upload
//                   multiple
//                   beforeUpload={() => false}
//                   onChange={({ fileList: newFileList }) => setFileList(newFileList)}
//                   fileList={fileList}
//                   accept="image/*"
//                   listType="picture-card"
//                 >
//                   {fileList.length >= 8 ? null : (
//                     <div>
//                       <PlusOutlined />
//                       <div style={{ marginTop: 8 }}>上传精修照片</div>
//                     </div>
//                   )}
//                 </Upload>
//               </Form.Item>

//               <Form.Item
//                 name="date"
//                 label="拍摄日期"
//                 rules={[{ required: true, message: '请选择拍摄日期' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>

//               <Form.Item
//                 name="tags"
//                 label="照片标签"
//               >
//                 <Select
//                   mode="tags"
//                   placeholder="请输入或选择标签"
//                   style={{ width: '100%' }}
//                   options={PRESET_TAGS.map(tag => ({ label: tag, value: tag }))}
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="description"
//                 label="照片描述"
//               >
//                 <TextArea
//                   rows={2}
//                   placeholder="请输入照片描述（可选）"
//                   maxLength={200}
//                   showCount
//                 />
//               </Form.Item>

//               <Form.Item>
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   loading={uploading}
//                   icon={<UploadOutlined />}
//                   style={{ background: '#52c41a', borderColor: '#52c41a' }}
//                 >
//                   上传精修照片
//                 </Button>
//               </Form.Item>
//             </Form>
//           </div>
//         </Modal>
//       </div>
//     </Layout>
//   );
// };

// export default PhotographyManagement;
