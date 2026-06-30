import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Modal, Select, App, Card, Checkbox, Image, Popconfirm, InputNumber } from 'antd'
import { Plus, Eye, Send, Trash2, RefreshCw } from 'lucide-react'
import { postApi } from '../../api/posts'
import { templateApi } from '../../api/templates'
import { platformStore, isPlatformLoggedIn } from '../../stores/platformStore'
import { useSnapshot } from 'valtio'
import type { PostRecord, PostTemplate, PostPlatformRecord, PlatformCode } from '../../types'
import dayjs from 'dayjs'

const platformLabels: Record<PlatformCode, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  kuaishou: '快手'
}

const platformIds: Record<PlatformCode, string> = {
  xiaohongshu: 'p1',
  douyin: 'p2',
  kuaishou: 'p3'
}

const statusColors: Record<string, string> = {
  generating: 'orange',
  content_ready: 'blue',
  publishing: 'cyan',
  published: 'green',
  partial_failed: 'gold',
  failed: 'red',
  cancelled: 'default'
}

const statusLabels: Record<string, string> = {
  generating: '创建中',
  content_ready: '文案创建完成',
  publishing: '发布中',
  published: '发布完成',
  partial_failed: '部分成功',
  failed: '失败',
  cancelled: '已取消'
}

const platformStatusColors: Record<string, string> = {
  pending: 'default',
  publishing: 'cyan',
  published: 'green',
  failed: 'red'
}

export function OneClickPostPage(): React.ReactElement {
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(false)

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [imageCount, setImageCount] = useState<number>(0)
  const [wordCount, setWordCount] = useState<number>(30)

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewPost, setViewPost] = useState<PostRecord | null>(null)
  const [viewPlatforms, setViewPlatforms] = useState<PostPlatformRecord[]>([])

  // Publish modal state
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishPost, setPublishPost] = useState<PostRecord | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)

  const { accounts } = useSnapshot(platformStore)
  const { message } = App.useApp()

  useEffect(() => {
    loadPosts()
    loadTemplates()
  }, [])

  const loadPosts = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await postApi.getList()
      if (res.code === 200 && res.data) {
        setPosts(res.data.items)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async (): Promise<void> => {
    try {
      const res = await templateApi.getList()
      if (res.code === 200 && res.data) {
        setTemplates(res.data.items)
      }
    } catch {
      /* ignore */
    }
  }

  // Create post flow
  const handleOpenCreate = (): void => {
    setSelectedTemplateId(null)
    setImageCount(0)
    setWordCount(30)
    setCreateModalOpen(true)
  }

  const handleCreate = async (): Promise<void> => {
    if (!selectedTemplateId) {
      message.warning('请选择模板')
      return
    }

    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) return

    setCreateLoading(true)

    try {
      // Create post with generating status - backend will handle AI generation
      const createRes = await postApi.create({
        template_id: template.id,
        status: 'generating',
        image_count: imageCount,
        word_count: wordCount
      })

      if (createRes.code !== 200 || !createRes.data) {
        throw new Error('创建贴文失败')
      }

      // Close modal and refresh list immediately
      setCreateModalOpen(false)
      loadPosts()
      message.success('贴文已创建，正在生成内容...')
    } catch {
      message.error('创建失败，请重试')
    } finally {
      setCreateLoading(false)
    }
  }

  // View post
  const handleView = async (post: PostRecord): Promise<void> => {
    setViewPost(post)
    setViewModalOpen(true)

    // Load platform statuses
    try {
      const res = await postApi.getPlatforms(post.id)
      if (res.code === 200 && res.data) {
        setViewPlatforms(res.data)
      }
    } catch {
      setViewPlatforms([])
    }
  }

  // Publish post
  const handleOpenPublish = (post: PostRecord): void => {
    setPublishPost(post)
    let images: string[] = []
    try {
      const parsed = post.image_urls ? JSON.parse(post.image_urls) : []
      images = Array.isArray(parsed) ? parsed : []
    } catch {
      images = []
    }
    setSelectedImages(images)
    setSelectedPlatforms([])
    setPublishModalOpen(true)
  }

  const handlePublish = async (): Promise<void> => {
    if (!publishPost) return
    if (selectedImages.length === 0) {
      message.warning('请至少选择一张图片')
      return
    }
    if (selectedPlatforms.length === 0) {
      message.warning('请至少选择一个平台')
      return
    }

    setPublishing(true)

    try {
      // Update post status to publishing
      await postApi.updateStatus(publishPost.id, 'publishing')

      // Add platforms
      await postApi.addPlatforms(publishPost.id, selectedPlatforms)

      // Publish to each platform
      const results: { platformId: string; success: boolean; error?: string }[] = []

      for (const platformId of selectedPlatforms) {
        // Find platform code from id
        const platformCode = Object.entries(platformIds).find(([, id]) => id === platformId)?.[0] as PlatformCode | undefined
        if (!platformCode) continue

        const api = window.app?.[platformCode]
        if (!api) {
          results.push({ platformId, success: false, error: '平台 API 不可用' })
          await postApi.updatePlatformStatus(publishPost.id, platformId, {
            status: 'failed',
            error: '平台 API 不可用'
          })
          continue
        }

        // Update platform status to publishing
        await postApi.updatePlatformStatus(publishPost.id, platformId, { status: 'publishing' })

        try {
          const hashtags = publishPost.hashtags ? publishPost.hashtags.split(',').filter(Boolean) : []
          const res = await api.publish({
            text: publishPost.content_text,
            imagePaths: selectedImages,
            hashtags
          })

          if (res.code === 200) {
            results.push({ platformId, success: true })
            await postApi.updatePlatformStatus(publishPost.id, platformId, {
              status: 'published',
              platformPostId: res.data?.platformPostId
            })
          } else {
            results.push({ platformId, success: false, error: res.msg })
            await postApi.updatePlatformStatus(publishPost.id, platformId, {
              status: 'failed',
              error: res.msg
            })
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '发布失败'
          results.push({ platformId, success: false, error: errorMsg })
          await postApi.updatePlatformStatus(publishPost.id, platformId, {
            status: 'failed',
            error: errorMsg
          })
        }
      }

      // Determine final status
      const successCount = results.filter((r) => r.success).length
      const failCount = results.filter((r) => !r.success).length

      let finalStatus: string
      let errorMsg: string | undefined

      if (failCount === 0) {
        finalStatus = 'published'
      } else if (successCount === 0) {
        finalStatus = 'failed'
        errorMsg = '全部平台发布失败'
      } else {
        finalStatus = 'partial_failed'
        errorMsg = `${failCount} 个平台发布失败`
      }

      await postApi.updateStatus(publishPost.id, finalStatus, errorMsg)

      if (finalStatus === 'published') {
        message.success('发布完成')
      } else if (finalStatus === 'partial_failed') {
        message.warning(`部分平台发布失败 (${successCount}/${results.length})`)
      } else {
        message.error('发布失败')
      }

      setPublishModalOpen(false)
      loadPosts()
    } catch {
      message.error('发布出错')
    } finally {
      setPublishing(false)
    }
  }

  const getAvailablePlatforms = (): { code: PlatformCode; id: string; name: string; loggedIn: boolean }[] => {
    return (Object.keys(accounts) as PlatformCode[]).map((code) => ({
      code,
      id: platformIds[code],
      name: platformLabels[code],
      loggedIn: isPlatformLoggedIn(code)
    }))
  }

  const handleDelete = async (post: PostRecord): Promise<void> => {
    try {
      await postApi.delete(post.id)
      message.success('删除成功')
      loadPosts()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '模板',
      dataIndex: 'template_name',
      key: 'template_name',
      minWidth: 100,
      render: (v: string) => v || '-'
    },
    {
      title: '内容预览',
      dataIndex: 'content_text',
      key: 'content_text',
      minWidth: 300,
      ellipsis: true,
      render: (v: string) => v || '生成中...'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: PostRecord) => {
        const canView = ['content_ready', 'publishing', 'published', 'partial_failed', 'failed'].includes(record.status)
        const canPublish = record.status === 'content_ready'
        return (
          <Space>
            {canView && (
              <Button type="link" icon={<Eye size={14} />} onClick={() => handleView(record)}>
                查看
              </Button>
            )}
            {canPublish && (
              <Button type="link" icon={<Send size={14} />} onClick={() => handleOpenPublish(record)}>
                发布
              </Button>
            )}
            <Popconfirm title="确定删除该贴文？" onConfirm={() => handleDelete(record)} okText="确定" cancelText="取消">
              <Button type="link" danger icon={<Trash2 size={14} />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  return (
    <Card
      className="h-full"
      title="发帖管理"
      extra={
        <Space>
          <Button icon={<RefreshCw size={14} />} onClick={loadPosts}>
            刷新
          </Button>
          <Button type="primary" icon={<Plus size={14} />} onClick={handleOpenCreate}>
            创建贴文
          </Button>
        </Space>
      }
    >
      <Table<PostRecord> dataSource={posts} columns={columns} rowKey="id" loading={loading} />

      {/* Create Post Modal */}
      <Modal
        title="创建贴文"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        okText="创建"
        confirmLoading={createLoading}
        destroyOnHidden
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">选择模板</label>
            <Select
              placeholder="请选择模板"
              className="w-full"
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              options={templates.map((t) => ({ label: t.name, value: t.id }))}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2 font-medium">生成图片</label>
              <InputNumber
                min={0}
                max={9}
                value={imageCount}
                onChange={(v) => setImageCount(v || 0)}
                className="w-full"
                addonAfter="张"
                step={1}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 font-medium">字数范围</label>
              <InputNumber
                min={10}
                max={500}
                value={wordCount}
                onChange={(v) => setWordCount(v || 30)}
                className="w-full"
                addonAfter="字"
                step={1}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* View Post Modal */}
      <Modal
        title="查看贴文"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={<Button onClick={() => setViewModalOpen(false)}>关闭</Button>}
        width={700}
      >
        {viewPost && (
          <div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">文案内容</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded whitespace-pre-wrap">
                {viewPost.content_text || '无内容'}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">图片</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  let images: string[] = []
                  try {
                    const parsed = viewPost.image_urls ? JSON.parse(viewPost.image_urls) : []
                    images = Array.isArray(parsed) ? parsed : []
                  } catch {
                    images = []
                  }
                  if (images.length === 0) {
                    return <span className="text-gray-500">无图片</span>
                  }
                  return images.map((url, i) => (
                    <Image key={i} src={`file://${url}`} width={100} height={100} style={{ objectFit: 'cover' }} />
                  ))
                })()}
              </div>
            </div>

            {viewPlatforms.length > 0 && (
              <div>
                <label className="block mb-2 font-medium">平台发布结果</label>
                <div className="space-y-2">
                  {viewPlatforms.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>{p.platform_name}</span>
                      <Space>
                        <Tag color={platformStatusColors[p.status]}>
                          {p.status === 'published' ? '发布成功' : p.status === 'failed' ? '发布失败' : p.status === 'publishing' ? '发布中' : '待发布'}
                        </Tag>
                        {p.error_message && <span className="text-red-500 text-sm">{p.error_message}</span>}
                      </Space>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Publish Post Modal */}
      <Modal
        title={publishPost && ['published', 'partial_failed', 'failed'].includes(publishPost.status) ? '重新发布' : '发布'}
        open={publishModalOpen}
        onCancel={() => !publishing && setPublishModalOpen(false)}
        onOk={handlePublish}
        okText="发布"
        confirmLoading={publishing}
        destroyOnHidden
        width={600}
      >
        {publishPost && (
          <div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">选择图片</label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  let images: string[] = []
                  try {
                    const parsed = publishPost.image_urls ? JSON.parse(publishPost.image_urls) : []
                    images = Array.isArray(parsed) ? parsed : []
                  } catch {
                    images = []
                  }
                  if (images.length === 0) {
                    return <span className="text-gray-500">无图片可选</span>
                  }
                  return images.map((url, i) => (
                    <div key={i} className="relative">
                      <Image
                        src={`file://${url}`}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', opacity: selectedImages.includes(url) ? 1 : 0.5 }}
                      />
                      <Checkbox
                        className="absolute top-1 left-1"
                        checked={selectedImages.includes(url)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImages([...selectedImages, url])
                          } else {
                            setSelectedImages(selectedImages.filter((u) => u !== url))
                          }
                        }}
                      />
                    </div>
                  ))
                })()}
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">选择平台</label>
              <Checkbox.Group
                value={selectedPlatforms}
                onChange={(vals) => setSelectedPlatforms(vals as string[])}
                className="flex flex-col gap-2"
              >
                {getAvailablePlatforms().map((p) => (
                  <Checkbox key={p.id} value={p.id} disabled={!p.loggedIn}>
                    {p.name} {!p.loggedIn && '(未登录)'}
                  </Checkbox>
                ))}
              </Checkbox.Group>
              {getAvailablePlatforms().every((p) => !p.loggedIn) && (
                <p className="text-red-500 mt-2">所有平台均未登录，请先去平台管理页登录</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
