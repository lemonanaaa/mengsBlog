# Career 页面实现说明

## 文件结构

```
src/pages/career/
├── index.tsx           # 入口文件，导出 View 组件
├── Model.ts            # 数据模型定义
├── Controller.ts       # 业务逻辑层
├── View.tsx            # UI 展示层
├── readMe.md           # 原始需求文档
└── README_IMPLEMENTATION.md  # 本文件
```

## 功能模块

### 1. 技能栈展示 (Skills)
- **核心技能**: 按分类展示技术栈（前端、后端、工具等）
- **熟练度**: 使用进度条可视化展示技能掌握程度
- **正在学习**: 展示当前学习中的技术，包含进度和描述

### 2. 工作经历 (Work Experience)
- **时间线展示**: 类似博客时间线的设计
- **工作详情**: 
  - 公司名称、职位
  - 在职时间（自动计算工作时长）
  - 工作职责列表
  - 主要成就列表
  - 使用的技术栈
- **当前工作标识**: 在职工作用绿色标记

### 3. 项目经历 (Projects)
- **项目信息**: 项目名称、描述、角色、时间
- **负责内容**: 列举主要职责
- **项目成果**: 展示量化的成就
- **项目亮点**: 用金色标签突出显示
- **技术栈**: 展示项目使用的技术

### 4. 精选博客 (Featured Blogs)
- **数据来源**: 从博客 API 获取标记为 `isFeatured: true` 的博客
- **展示信息**: 标题、摘要、标签、阅读时间、浏览量
- **跳转链接**: 点击可跳转到博客详情页
- **查看全部**: 按钮跳转到完整博客列表

## 数据管理

### 静态数据（当前实现）
- 技能栈、工作经历、项目经历目前使用 `Controller.ts` 中的静态数据
- 优点：快速实现，无需后端支持
- 修改方式：直接编辑 `Controller.ts` 中的数组数据

### 动态数据（未来扩展）
- 精选博客已使用 API 动态获取
- 可扩展后端 API 来管理技能、工作经历、项目信息
- 建议增加 meng 模式下的编辑功能

## 样式设计

### 颜色方案
- 主题色：`#1890ff` (Ant Design 蓝色)
- 成功/成就：`#52c41a` (绿色)
- 精选标识：金色标签
- 背景渐变：技能卡片使用淡蓝色渐变

### 响应式设计
- 移动端适配：768px 断点
- 卡片布局：使用 Ant Design Grid 系统
- 时间线：移动端自适应布局

### 交互效果
- 卡片悬停：阴影加深 + 上移动画
- 进度条：渐变色彩（蓝到绿）
- 标签：颜色区分不同类型信息

## 如何修改数据

### 1. 修改技能栈
编辑 `Controller.ts` 的 `getSkills()` 方法：
```typescript
{ name: 'React', level: 90, category: 'frontend' }
```

### 2. 修改学习内容
编辑 `Controller.ts` 的 `getLearning()` 方法：
```typescript
{
  name: 'Next.js',
  description: '学习描述',
  progress: 60,
  startDate: '2024-09',
  status: 'learning'
}
```

### 3. 修改工作经历
编辑 `Controller.ts` 的 `getWorkExperiences()` 方法：
```typescript
{
  company: '公司名称',
  position: '职位',
  startDate: '2022-06',
  endDate: '至今',  // 或具体日期 '2024-10'
  // ... 其他字段
}
```

### 4. 修改项目经历
编辑 `Controller.ts` 的 `getProjects()` 方法：
```typescript
{
  name: '项目名称',
  description: '项目描述',
  role: '你的角色',
  // ... 其他字段
}
```

### 5. 精选博客
在博客编辑页面将 `isFeatured` 设置为 `true` 即可自动显示

## 技术栈

- **框架**: React 18 + TypeScript
- **UI 库**: Ant Design
- **路由**: React Router
- **样式**: SCSS + CSS Modules
- **构建**: Gulp (SCSS 编译)

## 页面路由

- 主页: `/career`
- 支持 meng 模式: `/career?meng=true`

## 未来扩展建议

1. **后端 API 支持**
   - 创建 `/api/career/skills` 接口
   - 创建 `/api/career/experiences` 接口
   - 创建 `/api/career/projects` 接口

2. **Meng 模式编辑功能**
   - 在线编辑技能栈
   - 在线管理工作经历
   - 在线管理项目信息

3. **数据可视化**
   - 技能雷达图
   - 工作时长统计图
   - 技术栈使用频率分析

4. **导出简历**
   - PDF 导出功能
   - 支持多种模板
   - 可选择性导出内容

## 注意事项

1. 日期格式统一使用 `YYYY-MM` 格式（例如：`2024-10`）
2. 当前工作的 `endDate` 使用字符串 `"至今"`
3. 技能等级范围：0-100
4. 修改静态数据后无需重新编译，刷新页面即可
5. 修改 SCSS 样式后需运行 `npx gulp styles` 编译

## 示例数据

当前 Controller 中包含示例数据，你可以：
1. 直接使用示例数据测试页面效果
2. 根据实际情况修改示例数据
3. 完全替换为你的真实信息

---

创建时间: 2024-10-15
版本: 1.0.0

