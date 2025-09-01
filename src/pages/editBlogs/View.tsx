import React, { useState, useEffect } from "react";
import { Button, Input, message } from "antd";
import Layout from "../common/Layout";
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

import '@wangeditor/editor/dist/css/style.css'

const { TextArea } = Input;

const EditBlogs = () => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('<p>开始编写你的博客...</p>')
  const [loading, setLoading] = useState(false)

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {}
  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
  }

  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  // 提交博客
  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('请输入文章标题');
      return;
    }

    if (!content.trim() || content === '<p>开始编写你的博客...</p>') {
      message.error('请输入文章内容');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/blogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content,
          status: 'draft'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        message.success('博客保存成功！');
        // 清空表单
        setTitle('');
        setContent('<p>开始编写你的博客...</p>');
      } else {
        message.error(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存博客失败:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  // 兼容原有的上传按钮
  const handleOldSubmit = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3001/initblog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: content })
      });
      message.success('上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2>博客编辑器</h2>
        
        {/* 标题输入 */}
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="请输入文章标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="large"
            style={{ fontSize: '18px' }}
          />
        </div>

        {/* 富文本编辑器 */}
        <div style={{ border: '1px solid #ccc', borderRadius: '6px', marginBottom: '20px' }}>
          <Toolbar
            editor={editor}
            defaultConfig={toolbarConfig}
            mode="default"
            style={{ borderBottom: '1px solid #ccc' }}
          />
          <Editor
            defaultConfig={editorConfig}
            value={content}
            onCreated={setEditor}
            onChange={(editor) => setContent(editor.getHtml())}
            mode="default"
            style={{ height: '400px', overflowY: 'hidden' }}
          />
        </div>

        {/* 按钮区域 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            type="primary" 
            size="large"
            loading={loading}
            onClick={handleSubmit}
          >
            保存博客
          </Button>
          
          <Button 
            size="large"
            loading={loading}
            onClick={handleOldSubmit}
          >
            兼容上传
          </Button>
        </div>

        {/* 预览区域 */}
        <div style={{ marginTop: '30px' }}>
          <h3>内容预览</h3>
          <div 
            style={{ 
              border: '1px solid #eee', 
              padding: '20px', 
              borderRadius: '6px',
              minHeight: '200px',
              backgroundColor: '#fafafa'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default EditBlogs;
