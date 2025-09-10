// API配置文件
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:3001/api' : 'http://lemonanaaa.top/api');

export const API_CONFIG = {
  // 博客相关API
  BLOG_BASE_URL: API_BASE_URL,
  
  // 摄影相关API
  PHOTO_BASE_URL: API_BASE_URL,
  
  // 其他API配置
  RESUME_URL: '/resume.md', // 直接从public目录加载
};

// 通用API请求方法
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.PHOTO_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`正在请求API: ${url}`);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // 获取响应文本以了解错误详情
      const responseText = await response.text();
      console.error(`HTTP错误 ${response.status}: ${responseText}`);
      
      // 如果响应是HTML，可能是服务器错误页面
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error(`服务器返回了HTML页面而不是JSON数据。状态码: ${response.status}`);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
    }
    
    // 检查响应的Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.warn(`警告: 响应Content-Type不是JSON: ${contentType}`);
      console.warn(`响应内容: ${responseText.substring(0, 200)}...`);
    }
    
    const data = await response.json();
    console.log(`API响应成功:`, data);
    return data;
    
  } catch (error) {
    console.error(`API请求失败 [${url}]:`, error);
    
    // 提供更具体的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('网络连接失败，可能的原因:');
      console.error('1. 摄影API服务器没有在localhost:3001上运行');
      console.error('2. 网络连接问题');
      console.error('3. CORS配置问题');
    }
    
    throw error;
  }
};

// 博客API请求方法
export const blogApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BLOG_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('博客API请求失败:', error);
    throw error;
  }
};
