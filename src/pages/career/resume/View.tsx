import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/tomorrow.css';

import Layout from "../../common/Layout";

import '../../../css/career/resume.css';

const ResumeView = () => {

  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/resume.md')  // 直接从public目录加载
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('## 加载失败\n请检查文件路径'));
  }, []);

  return <Layout>
    <div className="container">
      这是简历页
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  </Layout>;
};

export default ResumeView;




