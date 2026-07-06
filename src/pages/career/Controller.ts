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
      { name: 'React Router', level: 85, category: 'frontend' },
      { name: '状态管理与复杂表单', level: 82, category: 'frontend' },
      
      // 工具&工程化
      { name: 'Git', level: 85, category: 'tools' },
      { name: 'Webpack', level: 75, category: 'tools' },
      { name: 'Vite', level: 70, category: 'tools' },
      { name: 'npm/yarn', level: 80, category: 'tools' },
      { name: 'Jest', level: 80, category: 'tools' },
      { name: 'CI/CD', level: 78, category: 'tools' },
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
        company: '携程（旅游BG）',
        position: '高级前端工程师',
        startDate: '2022-07',
        endDate: '至今',
        isCurrent: true,
        responsibilities: [
          '目前负责 VBK 线路订单模块，服务于业务与商家，提供跟团、邮轮、签证等业务线的相关操作功能。',
          '曾负责 VBK 点评、9072 系统、购物车部分模块。',
        ],
        achievements: [
          '性能提升、架构优化、监控体系配置、单端多端同构，配置监控报表、仓库流水线日常维护，探索 D2C 路径。',
          '输出技术文档、开发精准测试工具（推广至多组、覆盖 100+ 人使用）、开发 Chrome 插件自动生成自动化测试代码。',
        ],
        techStack: ['React', 'TypeScript', 'JavaScript', 'Ant Design', 'Webpack', 'Jest', 'Git']
      }
    ];
  }

  // 获取项目经历（目前使用静态数据，后续可改为API）
  static getProjects(): Project[] {
    return [
      {
        id: '1',
        name: '新版供应商退款 / 退优惠',
        description: '针对供应商退款/退优惠高频依赖人工的问题，建设供应商在 VBK 的自助处理能力，减少 OP 介入并提升处理效率',
        role: '核心开发',
        responsibilities: [
          '改造 VBK 退款/退优惠链路，统一前端操作入口与弹窗交互',
          '抽象金额计算与校验逻辑到 Pure-Model，实现 PC/H5 资源层与订单层复用',
          '通过配置化开关和白名单机制支持灰度放量与快速回滚'
        ],
        achievements: [
          '事件订单比由预计 8.39% 降至约 4%',
          '预计年减少事件量约 48,289 单',
          '预计节省服务成本约 96.6 万元/年，ROI 约 5.89'
        ],
        techStack: ['React', 'TypeScript', 'Pure-Model', 'Ant Design', '灰度发布'],
        startDate: '2023-08',
        endDate: '2024-03',
        companyId: '1',
        highlights: [
          '高频人工场景自动化',
          '支持灰度与快速回滚',
          'ROI 可量化'
        ]
      },
      {
        id: '2',
        name: '邮轮接入 VBK 系统',
        description: '在邮轮业务恢复后，将原独立系统数据接入 VBK，并完成订单相关能力适配',
        role: '核心开发',
        responsibilities: [
          '对现有跟团业务线进行适应性改造，通过开关配置准入供应商并展示对应订单数据',
          '重构原列表页和详情页，抽象公共业务逻辑至 Pure-Model，减少 PC/H5 重复代码',
          '优化流水线发布流程，加入 MR 拦截和覆盖率门禁，并将结果同步到群消息'
        ],
        achievements: [
          '优化供应商体验，费力度降低约 30%',
          '订单事件比降低约 0.55%',
          '邮轮私家团咨询单上线一周增长约 10 倍'
        ],
        techStack: ['React', 'TypeScript', 'Pure-Model', 'Webpack', 'CI/CD'],
        startDate: '2023-03',
        endDate: '2023-08',
        highlights: [
          '跨业务线适配',
          '跨端逻辑复用',
          '流程质量门禁'
        ]
      },
      {
        id: '3',
        name: '9072 新版工作台',
        description: '基于埋点与热力图数据，升级客服系统旧版 UI，提升操作效率与性能体验',
        role: '核心开发',
        responsibilities: [
          '完成 React-imvc 与 Ant Design 大版本升级和适配改造',
          '实现订单详情、订单快照、智能问答等新版交互模块',
          '通过拆包、延迟加载、图片压缩等手段优化首屏渲染性能'
        ],
        achievements: [
          'Lighthouse 指标提升',
          '页面跳出率下降约 40%',
          '新版操作日志点击量下降约 10%，售后 CPH 指标提升'
        ],
        techStack: ['React-imvc', 'React', 'TypeScript', 'Ant Design', 'Webpack'],
        startDate: '2022-10',
        endDate: '2023-03',
        companyId: '1',
        highlights: [
          '体验驱动改版',
          '性能专项治理',
          '客服效率提升'
        ]
      },
      {
        id: '4',
        name: '精准测试小工具',
        description: '针对传统覆盖率口径不聚焦改动代码的问题，建设以 diff 为分母的精准覆盖率能力',
        role: '方案设计与核心开发',
        responsibilities: [
          '使用 Istanbul 对代码进行插桩染色，统计页面真实执行代码',
          '结合 diff-test-coverage 将统计数据与 diff patch 对比，产出 diff 代码覆盖率',
          '对接测试平台与公共流水线，覆盖提测到测试发布全流程',
          '完成用户侧配置页面、数据结构设计与说明文档沉淀'
        ],
        achievements: [
          '提升研发自测效率与提测质量',
          '项目获得携程集团年度程果奖',
          '已推广至多个组，服务百余名研发同学'
        ],
        techStack: ['Jest', 'Istanbul', 'diff-test-coverage', 'CI/CD', 'Chrome Extension'],
        startDate: '2024-01',
        endDate: '2024-09',
        companyId: '1',
        highlights: [
          '覆盖率口径更精准',
          '全流程可落地',
          '多团队推广'
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

