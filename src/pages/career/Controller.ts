import { CareerData, WorkExperience, Project, Skill, Learning, FeaturedBlog } from './Model';
import { blogApiRequest } from '../../config/api';

export class CareerController {
  
  // 获取技能列表（目前使用静态数据，后续可改为API）
  static getSkills(): Skill[] {
    return [
      // 前端技术
      { name: 'React', level: 90, category: 'frontend' },
      { name: 'TypeScript', level: 85, category: 'frontend' },
      { name: 'JavaScript', level: 90, category: 'frontend' },
      { name: 'HTML5/CSS3', level: 85, category: 'frontend' },
      { name: 'SCSS', level: 80, category: 'frontend' },
      { name: 'Ant Design', level: 85, category: 'frontend' },
      
      // 后端技术
      { name: 'Node.js', level: 75, category: 'backend' },
      { name: 'Express', level: 70, category: 'backend' },
      { name: 'MongoDB', level: 65, category: 'backend' },
      
      // 工具&工程化
      { name: 'Git', level: 85, category: 'tools' },
      { name: 'Webpack', level: 75, category: 'tools' },
      { name: 'Vite', level: 70, category: 'tools' },
      { name: 'npm/yarn', level: 80, category: 'tools' },
    ];
  }

  // 获取正在学习的技术（目前使用静态数据，后续可改为API）
  static getLearning(): Learning[] {
    return [
      {
        name: 'Next.js',
        description: '学习服务端渲染(SSR)和静态站点生成(SSG)，提升Web性能',
        progress: 60,
        startDate: '2024-09',
        status: 'learning'
      },
      {
        name: 'WebAssembly',
        description: '探索Web高性能计算方案，尝试在浏览器中运行接近原生的性能',
        progress: 30,
        startDate: '2024-10',
        status: 'learning'
      },
      {
        name: 'Three.js',
        description: '学习3D图形渲染，为Web应用添加更丰富的视觉效果',
        progress: 45,
        startDate: '2024-08',
        status: 'learning'
      }
    ];
  }

  // 获取工作经历（目前使用静态数据，后续可改为API）
  static getWorkExperiences(): WorkExperience[] {
    return [
      {
        id: '1',
        company: '当前公司名称',
        position: '高级前端工程师',
        startDate: '2023-01',  // 修改为你的实际入职时间，格式：YYYY-MM
        endDate: '至今',
        isCurrent: true,
        responsibilities: [
          '负责公司核心产品的前端架构设计与开发',
          '参与产品需求讨论，提供技术方案',
          '优化现有代码，提升用户体验和性能'
        ],
        achievements: [
          '完成XX项目的前端开发，用户满意度提升25%',
          '优化页面性能，首屏加载速度提升40%',
          '建立前端代码规范，提升团队开发效率'
        ],
        techStack: ['React', 'TypeScript', 'JavaScript', 'Ant Design', 'Webpack', 'Git']
      },
      {
        id: '2',
        company: '上一家公司名称',
        position: '前端工程师',
        startDate: '2021-06',
        endDate: '2022-12',
        isCurrent: false,
        responsibilities: [
          '负责公司电商平台的前端开发',
          '维护和优化现有业务代码',
          '与后端团队协作完成API对接'
        ],
        achievements: [
          '独立完成商品详情页重构，转化率提升15%',
          '实现购物车模块性能优化，响应速度提升50%',
          '参与移动端H5页面开发，支持多种机型适配'
        ],
        techStack: ['Vue', 'JavaScript', 'Element UI', 'Vuex', 'Webpack']
      }
    ];
  }

  // 获取项目经历（目前使用静态数据，后续可改为API）
  static getProjects(): Project[] {
    return [
      {
        id: '1',
        name: '企业级管理后台系统',
        description: '面向企业内部的数据管理平台，支持多角色权限管理、数据可视化、报表生成等功能',
        role: '前端负责人',
        responsibilities: [
          '负责整体前端架构设计',
          '开发核心业务模块',
          '指导团队成员进行开发',
          '与后端对接API设计'
        ],
        achievements: [
          '采用微前端架构，支持多团队并行开发',
          '自研数据可视化组件库，减少第三方依赖',
          '建立完善的权限系统，支持细粒度权限控制'
        ],
        techStack: ['React', 'TypeScript', 'Ant Design', 'ECharts', 'qiankun'],
        startDate: '2022-06',
        endDate: '2023-12',
        companyId: '1',
        highlights: [
          '用户数突破10000+',
          '日活用户3000+',
          '系统稳定性99.9%'
        ]
      },
      {
        id: '2',
        name: '个人网站 & 摄影作品展示平台',
        description: '个人品牌网站，集成了简历展示、博客系统、摄影作品管理等功能',
        role: '全栈开发',
        responsibilities: [
          '独立完成前后端开发',
          '设计并实现博客系统',
          '开发照片管理和展示功能',
          '部署和运维'
        ],
        achievements: [
          '实现响应式设计，完美支持移动端',
          '自建博客系统，支持Markdown编辑',
          '照片批量上传和管理功能'
        ],
        techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Ant Design'],
        startDate: '2024-01',
        endDate: '至今',
        highlights: [
          '全栈独立开发',
          '现代化UI设计',
          '高性能优化'
        ]
      },
      {
        id: '3',
        name: '电商平台商品详情页重构',
        description: '重构电商平台的商品详情页，提升用户体验和转化率',
        role: '核心开发',
        responsibilities: [
          '分析现有页面性能问题',
          '设计新的页面结构',
          '实现商品图片预加载优化',
          '优化购买流程交互'
        ],
        achievements: [
          '首屏加载时间减少50%',
          '转化率提升15%',
          '用户停留时间增加30%'
        ],
        techStack: ['Vue', 'JavaScript', 'Webpack', 'Lazy Load'],
        startDate: '2021-06',
        endDate: '2021-09',
        companyId: '2',
        highlights: [
          '性能优化显著',
          '转化率大幅提升'
        ]
      }
    ];
  }

  // 从博客API获取精选博客（只获取标题和链接信息）
  static async getFeaturedBlogs(limit: number = 5): Promise<FeaturedBlog[]> {
    try {
      // 调用博客API，获取精选博客
      const response = await blogApiRequest('/blogs?isMeng=false');
      
      if (response.data && Array.isArray(response.data)) {
        // 筛选精选博客并限制数量
        return response.data
          .filter((blog: any) => blog.isFeatured)
          .slice(0, limit)
          .map((blog: any) => ({
            _id: blog._id,
            title: blog.title,
            summary: blog.summary,
            tags: blog.tags || [],
            readingTime: blog.readingTime || 0,
            viewCount: blog.viewCount || 0,
            createdAt: blog.createdAt,
            isFeatured: blog.isFeatured
          }));
      }
      
      return [];
    } catch (error) {
      console.error('获取精选博客失败:', error);
      return [];
    }
  }

  // 获取所有 Career 数据
  static async getAllCareerData(): Promise<CareerData> {
    const [featuredBlogs] = await Promise.all([
      this.getFeaturedBlogs(5)
    ]);

    return {
      skills: this.getSkills(),
      learning: this.getLearning(),
      workExperiences: this.getWorkExperiences(),
      projects: this.getProjects(),
      featuredBlogs
    };
  }

  // 格式化日期
  static formatDate(dateString: string): string {
    if (dateString === '至今') return dateString;
    
    const [year, month] = dateString.split('-');
    return `${year}年${month}月`;
  }

  // 计算工作时长
  static calculateDuration(startDate: string, endDate: string): string {
    if (endDate === '至今') {
      endDate = new Date().toISOString().slice(0, 7); // YYYY-MM
    }
    
    const start = new Date(startDate + '-01');
    const end = new Date(endDate + '-01');
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months}个月`;
    } else if (remainingMonths === 0) {
      return `${years}年`;
    } else {
      return `${years}年${remainingMonths}个月`;
    }
  }
}

