import React, { useState, useEffect } from "react";
import { Button, Input, message, Select, Card, Space, Tag, Checkbox } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

import '@wangeditor/editor/dist/css/style.css'
import '../../css/career/editBlogs.css'

const { TextArea } = Input;
const { Option } = Select;

const EditBlogs = () => {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('<p>开始编写你的博客...</p>')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('draft')
  const [isFeatured, setIsFeatured] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [originalData, setOriginalData] = useState({
    title: '',
    content: '',
    summary: '',
    status: 'draft',
    isFeatured: false,
    tags: [] as string[]
  })
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 从 URL 参数获取 blogId
  const blogId = searchParams.get('blogId')
  // 检查是否为新增模式
  const isNewBlog = !blogId || blogId === 'new'
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true'

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {}
  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
  }

  // 获取博客详情（编辑模式）
  const fetchBlog = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/blogs/${id}`)
      if (response.ok) {
        const data = await response.json()
        const blog = data.data || data
        setTitle(blog.title || '')
        setContent(blog.content || '<p>开始编写你的博客...</p>')
        setSummary(blog.summary || '')
        setStatus(blog.status || 'draft')
        setIsFeatured(blog.isFeatured || false)
        setTags(blog.tags || [])
        setOriginalData({
          title: blog.title || '',
          content: blog.content || '<p>开始编写你的博客...</p>',
          summary: blog.summary || '',
          status: blog.status || 'draft',
          isFeatured: blog.isFeatured || false,
          tags: blog.tags || []
        })
      } else {
        message.error('获取博客详情失败')
      }
    } catch (error) {
      message.error('网络错误')
      console.error('Error fetching blog:', error)
    } finally {
      setLoading(false)
    }
  }

  // 标签管理函数
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }



  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return
      editor.destroy()
      setEditor(null)
    }
  }, [editor])

  // 加载博客数据（编辑模式）
  useEffect(() => {
    if (blogId && blogId !== 'new') {
      fetchBlog(blogId)
    }
  }, [blogId])

  // 提交博客
  const handleSubmit = async () => {
    // 直接比较当前数据和原始数据
    if (!isNewBlog) {
      const currentData = {
        title: title,
        content: content,
        summary: summary,
        status: status,
        isFeatured: isFeatured,
        tags: tags
      }
      
      if (JSON.stringify(currentData) === JSON.stringify(originalData)) {
        message.info('没有检测到任何改动，无需保存');
        return;
      }
    }

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
      const url = isNewBlog
        ? 'http://localhost:3001/blogs'
        : `http://localhost:3001/blogs/${blogId}`

      const method = isNewBlog ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content,
          summary: summary.trim(),
          status: status,
          isFeatured: isFeatured,
          tags: tags
        })
      });

      const result = await response.json();

      if (result.success) {
        message.success(isNewBlog ? '博客创建成功！' : '博客更新成功！');
        navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)
      } else {
        message.error(result.message || (isNewBlog ? '创建失败' : '更新失败'));
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
      <div className="edit-blogs-page">
        {/* 返回按钮 */}
        <div className="back-button-container">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
          >
            返回列表
          </Button>
        </div>

        <Card>
          <div className="card-header">
            <h2>{isNewBlog ? '新建博客' : '编辑博客'}</h2>
            {isMeng && (
              <div className="meng-tag-container">
                <Tag color="blue">Meng 模式</Tag>
              </div>
            )}
          </div>

          {/* 标题输入 */}
          <div className="title-input-container">
            <div className="title-label">标题：</div>
            <Input
              placeholder="请输入文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="large"
              className="title-input"
            />
          </div>

          {/* 摘要输入 */}
          <div className="summary-input-container">
            <div className="summary-label">摘要：</div>
            <TextArea
              placeholder="请输入博客摘要（可选）"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              maxLength={200}
              showCount
              className="summary-textarea"
            />
          </div>
          {/* 标签输入、发布状态和精选选项 - 放在同一行 */}
          <div className="tags-status-featured-container">
            {/* 标签输入 */}
            <div className="tags-label">标签：</div>
            <div className="tag-input-container">
              <Input
                placeholder="输入标签后按回车或点击添加"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                className="tag-input"
              />
              <Button onClick={addTag} disabled={!tagInput.trim()}>
                添加
              </Button>
            </div>

            {/* 发布状态选择 */}
            <div className="status-label">发布状态：</div>
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: '200px' }}
            >
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>

            {/* 精选选项 */}
            <div className="featured-label">精选：</div>
            <Checkbox
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
          </div>

          {tags.length > 0 && (
            <div className="tags-display-container">
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  color="blue"
                  closable
                  onClose={() => removeTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          {/* 富文本编辑器 */}
          <div className="editor-container">
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              className="editor-toolbar"
            />
            <Editor
              defaultConfig={editorConfig}
              value={content}
              onCreated={setEditor}
              onChange={(editor) => setContent(editor.getHtml())}
              mode="default"
              className="editor-content"
            />
          </div>

          {/* 按钮区域 */}
          <div className="button-container">
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleSubmit}
              icon={<SaveOutlined />}
            >
              {isNewBlog ? '创建博客' : '更新博客'}
            </Button>
            <Button
              size="large"
              onClick={() => navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)}
            >
              取消
            </Button>
          </div>
        </Card>

        {/* 预览区域 */}
        <div className="preview-container">
          <h3>内容预览</h3>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default EditBlogs;
