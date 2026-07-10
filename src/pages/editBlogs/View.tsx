import React, { useState, useEffect } from "react";
import { Button, Input, message, Select, Card, Space, Tag, Checkbox, Modal } from "antd";
import { ArrowLeftOutlined, SaveOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "../common/Layout";
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

import '@wangeditor/editor/dist/css/style.css'
import '../../css/career/editBlogs.css'
import { blogApiRequest, API_CONFIG, uploadBlogImage } from '../../config/api';

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

  // 工具栏配置 - 使用 wangEditor 默认全量工具栏（含颜色/背景色/下划线/字号等）
  const toolbarConfig: Partial<IToolbarConfig> = {}
  // 编辑器配置 - 含统一图片上传
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        // wangEditor 内部把按钮点击、粘贴、拖拽三种触发路径收敛到此 hook
        customUpload: async (file: File, insertFn: (url: string) => void) => {
          try {
            const { url } = await uploadBlogImage(file);
            insertFn(url);
          } catch (err: any) {
            message.error(err?.message || '图片上传失败');
          }
        },
      },
    },
  }

  // 获取博客详情（编辑模式）
  const fetchBlog = async (id: string) => {
    setLoading(true)
    try {
      const data = await blogApiRequest(`/blogs/${id}`)
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

  // 默认的空内容占位符
  const EMPTY_CONTENT = '<p>开始编写你的博客...</p>'

  // 判断是否存在未保存的改动
  const hasUnsavedChanges = () => {
    if (isNewBlog) {
      // 新建模式：只要填写了任意内容就视为有改动
      return (
        title.trim() !== '' ||
        summary.trim() !== '' ||
        tags.length > 0 ||
        (content.trim() !== '' && content !== EMPTY_CONTENT)
      )
    }
    // 编辑模式：与加载时的原始数据做比较
    const currentData = {
      title,
      content,
      summary,
      status,
      isFeatured,
      tags
    }
    return JSON.stringify(currentData) !== JSON.stringify(originalData)
  }

  // 真正执行返回列表
  const goToList = () => {
    navigate(`/career/blogsWithTimeline${isMeng ? '?meng=true' : ''}`)
  }

  // 返回/取消前的未保存确认
  const handleLeave = () => {
    if (hasUnsavedChanges()) {
      Modal.confirm({
        title: '还有未保存的修改',
        content: '当前博客内容尚未保存，离开后这些修改将会丢失。确定要离开吗？',
        okText: '离开',
        okButtonProps: { danger: true },
        cancelText: '继续编辑',
        onOk: goToList
      })
    } else {
      goToList()
    }
  }

  // 浏览器刷新/关闭标签页时的未保存提示
  useEffect(() => {
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnloadHandler)
    return () => window.removeEventListener('beforeunload', beforeUnloadHandler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, summary, status, isFeatured, tags, originalData, isNewBlog])

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
      const endpoint = isNewBlog ? '/blogs' : `/blogs/${blogId}`;
      const method = isNewBlog ? 'POST' : 'PUT';

      const result = await blogApiRequest(endpoint, {
        method,
        body: JSON.stringify({
          title: title.trim(),
          content: content,
          summary: summary.trim(),
          status: status,
          isFeatured: isFeatured,
          tags: tags
        })
      });

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
      await blogApiRequest('/initblog', {
        method: 'POST',
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
            onClick={handleLeave}
          >
            返回列表
          </Button>
        </div>

        <Card>
          <div className="card-header">
            <h2>{isNewBlog ? '新建博客' : '编辑博客'}</h2>
            {isMeng && (
              <div className="meng-tag-container">
                <Tag color="purple" icon={<CrownOutlined />}>meng模式</Tag>
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
              onClick={handleLeave}
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
