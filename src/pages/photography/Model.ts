import type { UploadFile } from 'antd/es/upload/interface';

// 图片上传数据接口
export interface PhotoUpload {
  id: string;
  file: UploadFile;
  title: string;
  description?: string;
  tags: string[];
  date: string;
  friendName: string;
  friendFullName: string;
  phoneTail: string;
  thumbnail?: string;
  uploadTime?: string;
  status?: 'uploading' | 'success' | 'error';
}

// 照片会话接口
export interface PhotoSession {
  id: string;
  date: string;
  friendName: string;
  friendFullName: string;
  phoneTail: string;
  password: string;
  isPublic: boolean;
  // 新增可选字段
  batchName?: string;      // 拍摄批次名称
  location?: string;       // 拍摄地点
  description?: string;    // 描述信息
  
  // 分类信息
  tags?: string[];         // 标签数组
  isFeatured?: boolean;    // 是否精选（默认false）
  sortOrder?: number;      // 排序权重（默认0）
  
  // 拍摄详情
  theme?: string;          // 拍摄主题（选填，最多100字符）
  
  // 设备信息
  camera?: string;         // 相机型号
  lens?: string;           // 镜头型号
  aperture?: string;       // 光圈
  shutterSpeed?: string;   // 快门速度
  iso?: string;            // ISO值
  focalLength?: string;    // 焦距
  
  // 环境信息
  weather?: string;        // 天气条件
  lighting?: string;       // 光线条件
  
  // 代表性照片
  representativePhoto?: {
    filename: string;
    title: string;
    shootDate: string;
    isRetouched: boolean;
    isFeatured: boolean;
    imageUrl: string;
    thumbnailUrl: string;
  };
  
  // 照片总数
  totalPhotos?: number;
  
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
}

// 照片接口
export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  tags: string[];
  date: string;
  sessionId: string;
  isRetouched?: boolean;  // 是否为精修/精选照片
  createdAt: string;
  updatedAt: string;
}

// 上传配置接口
export interface UploadConfig {
  maxFileSize: number; // 最大文件大小 (bytes)
  allowedTypes: string[]; // 允许的文件类型
  maxFiles: number; // 最大文件数量
  thumbnailSize: {
    width: number;
    height: number;
  };
}

// 默认上传配置
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: 30 * 1024 * 1024, // 30MB - 适合大多数相机拍摄
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'],
  maxFiles: 100, // 支持大量照片上传，适合摄影工作
  thumbnailSize: {
    width: 300, // 提高缩略图质量
    height: 300
  }
};

// 预设标签
export const PRESET_TAGS = [
  '人像', '风景', '街拍', '建筑', '美食', '宠物', '婚礼', '商业',
  '樱花', '春天', '夏天', '秋天', '冬天', '夜景', '黑白', '彩色',
  '室内', '室外', '自然光', '人工光', '特写', '全景', '构图', '色彩'
];

// 客户信息接口
export interface CustomerInfo {
  name: string;
  fullName: string;
  phoneTail: string;
  email?: string;
  notes?: string;
}

// 上传响应接口
export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    photoId: string;
    url: string;
    thumbnail: string;
  };
  error?: string;
}

// 批量上传请求接口
export interface BatchUploadRequest {
  photos: Omit<PhotoUpload, 'id' | 'thumbnail' | 'uploadTime' | 'status'>[];
  sessionInfo?: {
    date: string;
    customerInfo: CustomerInfo;
    isPublic: boolean;
  };
}

// 批量上传响应接口
export interface BatchUploadResponse {
  success: boolean;
  message: string;
  data?: {
    uploadedPhotos: PhotoUpload[];
    failedPhotos: Array<{
      fileName: string;
      error: string;
    }>;
  };
  error?: string;
}
