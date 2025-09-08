import { PhotoUpload, PhotoSession } from './Model';
import { apiRequest, API_CONFIG } from '../../config/api';

export class PhotographyController {
  // 处理图片上传
  static async uploadPhotos(photos: PhotoUpload[]): Promise<boolean> {
    try {
      // 这里应该调用后端API进行实际的图片上传
      // 目前先模拟上传过程
      console.log('开始上传图片:', photos);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟上传成功
      console.log('图片上传成功');
      return true;
      
    } catch (error) {
      console.error('图片上传失败:', error);
      return false;
    }
  }

  // 获取已上传的图片列表
  static async getUploadedPhotos(): Promise<PhotoUpload[]> {
    try {
      // 这里应该调用后端API获取已上传的图片
      // 目前返回空数组
      return [];
      
    } catch (error) {
      console.error('获取图片列表失败:', error);
      return [];
    }
  }

  // 获取指定批次的照片
  static async getSessionPhotos(sessionId: string): Promise<any[]> {
    try {
      // 调用真实API: GET /shoot-sessions/:id/photos
      const response = await apiRequest(`/shoot-sessions/${sessionId}/photos`);
      
      return response.photos || [];
      
    } catch (error) {
      console.error('获取批次照片失败:', error);
      return [];
    }
  }

  // 删除已上传的图片
  static async deletePhoto(photoId: string): Promise<boolean> {
    try {
      // 调用真实API: DELETE /photos/:id
      await apiRequest(`/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      return true;
      
    } catch (error) {
      console.error('删除图片失败:', error);
      return false;
    }
  }

  // 批量删除多张图片
  static async deletePhotos(photoIds: string[]): Promise<{ success: boolean; deletedCount: number; failedIds: string[] }> {
    try {
      // 调用批量删除API: POST /photos/delete
      const response = await apiRequest('/photos/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoIds: photoIds
        })
      });
      
      // 假设API返回格式为 { success: boolean, deletedCount: number, failedIds: string[] }
      return {
        success: response.success || true,
        deletedCount: response.deletedCount || photoIds.length,
        failedIds: response.failedIds || []
      };
      
    } catch (error) {
      console.error('批量删除图片失败:', error);
      return {
        success: false,
        deletedCount: 0,
        failedIds: photoIds
      };
    }
  }

  // 获取所有照片批次
  static async getAllPhotoSessions(): Promise<PhotoSession[]> {
    try {
      // 调用真实API: GET /shoot-sessions/overview
      const response = await apiRequest('/shoot-sessions/overview');
      
      // 检查响应格式是否正确
      if (!response || typeof response !== 'object') {
        console.error('API响应格式错误:', response);
        return [];
      }
      
      // 检查是否包含sessions字段
      if (!response.sessions || !Array.isArray(response.sessions)) {
        console.error('API响应缺少sessions字段:', response);
        return [];
      }
      
      // 转换API响应格式为本地PhotoSession格式
      return response.sessions.map((session: any) => ({
        id: session.id,
        date: session.date,
        friendName: session.friendName,
        friendFullName: session.friendFullName,
        phoneTail: session.phoneTail,
        password: session.password,
        isPublic: session.isPublic,
        // 新增字段
        batchName: session.batchName,
        location: session.location,
        description: session.description,
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
        lighting: session.lighting,
        photos: session.photos || [],
        // 添加代表性照片字段
        representativePhoto: session.representativePhoto ? {
          filename: session.representativePhoto.filename,
          title: session.representativePhoto.title,
          shootDate: session.representativePhoto.shootDate,
          isRetouched: session.representativePhoto.isRetouched,
          isFeatured: session.representativePhoto.isFeatured,
          imageUrl: session.representativePhoto.imageUrl,
          thumbnailUrl: session.representativePhoto.thumbnailUrl
        } : null,
        // 添加照片总数字段
        totalPhotos: session.totalPhotos,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }));
      
    } catch (error) {
      console.error('获取照片批次失败:', error);
      
      // 如果是网络错误，提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          console.error('网络连接失败，请检查摄影API服务器是否在localhost:3001上运行');
        } else if (error.message.includes('JSON')) {
          console.error('API响应格式错误，服务器可能返回了HTML页面而不是JSON数据');
        }
      }
      
      return [];
    }
  }

  // 创建新的照片批次
  static async createPhotoSession(sessionData: {
    date: string;
    friendName: string;
    friendFullName: string;
    phoneTail: string;
    isPublic: boolean;
    batchName?: string;
    location?: string;
    description?: string;
    // 新增字段
    tags?: string[];
    isFeatured?: boolean;
    sortOrder?: number;
    theme?: string;
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    focalLength?: string;
    weather?: string;
    lighting?: string;
  }): Promise<PhotoSession | null> {
    try {
      // 调用真实API: POST /shoot-sessions
      const response = await apiRequest('/shoot-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      
      // 转换API响应格式为本地PhotoSession格式
      return {
        id: response.id,
        ...sessionData,
        password: response.password,
        photos: response.photos || [],
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
      
    } catch (error) {
      console.error('创建批次失败:', error);
      return null;
    }
  }

  // 删除照片批次
  static async deletePhotoSession(sessionId: string): Promise<boolean> {
    try {
      // 调用真实API: DELETE /shoot-sessions/:id
      await apiRequest(`/shoot-sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      return true;
      
    } catch (error) {
      console.error('删除批次失败:', error);
      return false;
    }
  }

  // 更新照片批次信息
  static async updatePhotoSession(sessionId: string, sessionData: {
    date: string;
    friendName: string;
    friendFullName: string;
    phoneTail: string;
    isPublic: boolean;
    batchName?: string;
    location?: string;
    description?: string;
    // 新增字段
    tags?: string[];
    isFeatured?: boolean;
    sortOrder?: number;
    theme?: string;
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    focalLength?: string;
    weather?: string;
    lighting?: string;
  }): Promise<PhotoSession | null> {
    try {
      // 调用真实API: PUT /shoot-sessions/:id
      const response = await apiRequest(`/shoot-sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(sessionData)
      });
      
      // 转换API响应格式为本地PhotoSession格式
      return {
        id: response.id,
        ...sessionData,
        password: response.password,
        photos: response.photos || [], // 保持原有照片
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
      
    } catch (error) {
      console.error('更新批次失败:', error);
      return null;
    }
  }

  // 上传照片到指定批次
  static async uploadPhotosToSession(sessionId: string, photos: PhotoUpload[], session?: PhotoSession): Promise<boolean> {
    try {
      // 调用真实API: POST /photos/upload
      const formData = new FormData();
      
      // 批次信息（共用信息）
      formData.append('shootSession', sessionId);
      
      // 从批次会话获取批次级别的信息（如果存在）
      if (session) {
        // 拍摄日期
        if (session.date) {
          formData.append('shootDate', session.date);
        }
        
        // 拍摄地点
        if (session.location) {
          formData.append('shootLocation', session.location);
        }
        
        // 相机型号
        if (session.camera) {
          formData.append('camera', session.camera);
        }
        
        // 镜头型号
        if (session.lens) {
          formData.append('lens', session.lens);
        }
        
        // 拍摄参数
        const settings: any = {};
        if (session.aperture) settings.aperture = session.aperture;
        if (session.shutterSpeed) settings.shutterSpeed = session.shutterSpeed;
        if (session.iso) settings.iso = session.iso;
        if (session.focalLength) settings.focalLength = session.focalLength;
        
        if (Object.keys(settings).length > 0) {
          formData.append('settings', JSON.stringify(settings));
        }
        
        // 标签
        if (session.tags && session.tags.length > 0) {
          formData.append('tags', JSON.stringify(session.tags));
        }
        
        // 描述
        if (session.description) {
          formData.append('description', session.description);
        }
        
        // 图片类型（默认normal）
        formData.append('imageType', 'normal');
      }
      
      // 添加所有图片文件
      photos.forEach((photo) => {
        if (photo.file.originFileObj) {
          formData.append('images', photo.file.originFileObj);
        }
      });
      
      const response = await fetch(`${API_CONFIG.PHOTO_BASE_URL}/photos/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('上传失败响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('上传照片到批次失败:', error);
      return false;
    }
  }

  // 验证图片文件
  static validateImageFile(file: File): { isValid: boolean; message?: string } {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return { isValid: false, message: '只能上传图片文件' };
    }

    // 检查文件大小 (30MB) - 适合大多数相机拍摄
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, message: '图片大小不能超过30MB' };
    }

    // 检查文件扩展名 - 支持常用专业格式
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, message: '不支持的图片格式' };
    }

    return { isValid: true };
  }

  // 生成缩略图
  static async generateThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算缩略图尺寸
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制缩略图
        ctx?.drawImage(img, 0, 0, width, height);

        // 转换为base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
