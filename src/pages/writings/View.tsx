import React from "react";
import Layout from "../common/Layout";

const Writings = () => {
  return (
    <Layout>
      <div style={{ maxWidth: "860px", lineHeight: 1.8 }}>
        <h1>Meng's 碎碎念</h1>
        <p>
          这里记录我的技术学习、业务复盘和一些长期主义的小结。内容以真实项目经验为主，
          关注“为什么这样做”以及“这样做带来的收益”。
        </p>

        <h2>写作主题</h2>
        <ul>
          <li>复杂业务中的前端方案设计与落地复盘</li>
          <li>性能优化、稳定性建设与监控体系实践</li>
          <li>工程效率工具和研发流程优化</li>
          <li>阶段性学习笔记与方法论沉淀</li>
        </ul>

        <h2>阅读建议</h2>
        <p>
          如果你希望按时间线查看我对外发布的技术文章，可以先前往 Career 页面中的
          <strong>「Blogs with timeLine」</strong>。
        </p>
      </div>
    </Layout>
  );
};

export default Writings;
