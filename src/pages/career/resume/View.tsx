import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Layout from "../../common/Layout.tsx";

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
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');

            if (!inline && match) {
              return (
                <CopyComponent children={children} match={match} {...props} />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  </Layout>;
};

export default ResumeView;



const CopyComponent = ({ children, match, ...props }: { children: React.ReactNode, match: RegExpExecArray }) => {

  const [copied, setCopied] = useState(false);
  return <div style={{ position: 'relative' }}>
    <CopyToClipboard
      text={String(children).replace(/\n$/, '')}
      onCopy={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }}
    >
      <button className="custom-copy-btn"
      >
        {copied ? '已复制!' : '复制'}
      </button>
    </CopyToClipboard>
    <SyntaxHighlighter

      style={tomorrow}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  </div>
}




