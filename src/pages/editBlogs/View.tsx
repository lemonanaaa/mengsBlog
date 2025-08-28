import React, { useState, useEffect } from "react";
import { Button } from "antd";
import Layout from "../common/Layout.tsx";
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

import '@wangeditor/editor/dist/css/style.css'

const EditBlogs = () => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  // 编辑器内容
  const [html, setHtml] = useState('<p>hello</p>')

  // 模拟 ajax 请求，异步设置 html
  useEffect(() => {
    setTimeout(() => {
      setHtml('<p>hello world</p>')
    }, 1500)
  }, [])

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {}
  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
  }

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  return <Layout>从这里写blog

    <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #ccc' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={html}
        onCreated={setEditor}
        onChange={(editor) => setHtml(editor.getHtml())}
        mode="default"
        style={{ height: '500px', overflowY: 'hidden' }}
      />
    </div>
    <div style={{ marginTop: '15px' }}>{html}</div>

    <Button onClick={async () => {
      await fetch('http://localhost:3001/api/initblog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html })
      })

    }}>上传</Button>
  </Layout>;
};

export default EditBlogs;
