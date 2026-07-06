import React from "react";
import Layout from "../../common/Layout";

const BlogsTreeView = () => {
  return (
    <Layout>
      <div style={{ maxWidth: "860px", lineHeight: 1.8 }}>
        <h1>知识树</h1>
        <p>
          这个页面用于整理我在实际工作中长期沉淀的前端知识地图。它不是教材目录，而是以
          真实业务问题为导向的能力结构。
        </p>

        <h2>核心分支</h2>
        <ul>
          <li>基础能力：JavaScript / TypeScript、浏览器机制、网络与性能基础</li>
          <li>工程体系：模块化、构建发布、测试策略、质量门禁与流水线治理</li>
          <li>业务架构：复杂状态建模、组件抽象、跨端复用与可维护性设计</li>
          <li>稳定性建设：监控告警、排障手册、可观测性指标与回归机制</li>
        </ul>

        <h2>使用方式</h2>
        <p>
          你可以把它理解为我的“技术导航索引”：先看结构，再去时间线文章里看具体案例与实践细节。
        </p>
      </div>
    </Layout>
  );
};

export default BlogsTreeView;
