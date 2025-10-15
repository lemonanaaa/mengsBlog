// 技能接口
export interface Skill {
  name: string;
  level: number; // 0-100
  category: 'frontend' | 'backend' | 'tools' | 'other';
}

// 学习中的技术接口
export interface Learning {
  name: string;
  description: string;
  progress?: number; // 0-100
  startDate: string;
  status: 'learning' | 'completed';
}

// 工作经历接口
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string; // "至今" for current job
  responsibilities: string[];
  achievements: string[];
  techStack: string[];
  logo?: string;
  isCurrent?: boolean;
}

// 项目接口
export interface Project {
  id: string;
  name: string;
  description: string;
  role: string;
  responsibilities: string[];
  achievements: string[];
  techStack: string[];
  startDate: string;
  endDate: string;
  companyId?: string; // 关联工作经历
  highlights?: string[]; // 项目亮点
}

// 精选博客接口（简化版，只用于展示链接）
export interface FeaturedBlog {
  _id: string;
  title: string;
  summary?: string;
  tags: string[];
  readingTime: number;
  viewCount: number;
  createdAt: string;
  isFeatured: boolean;
}

// Career 页面数据接口
export interface CareerData {
  skills: Skill[];
  learning: Learning[];
  workExperiences: WorkExperience[];
  projects: Project[];
  featuredBlogs?: FeaturedBlog[];
}

// 技能分类
export const SKILL_CATEGORIES = {
  frontend: '前端技术',
  backend: '后端技术',
  tools: '工具&工程化',
  other: '其他'
} as const;

// 预设技术栈标签
export const PRESET_TECH_TAGS = [
  'React', 'TypeScript', 'JavaScript', 'Vue', 'Angular',
  'HTML5', 'CSS3', 'SCSS', 'Tailwind CSS', 'Ant Design',
  'Node.js', 'Express', 'Koa', 'MongoDB', 'MySQL',
  'Webpack', 'Vite', 'Git', 'Docker', 'CI/CD',
  'Next.js', 'Nuxt.js', 'Redux', 'MobX', 'React Router',
  'Jest', 'Testing Library', 'Cypress', 'Storybook',
  'RESTful API', 'GraphQL', 'WebSocket', 'PWA'
];

