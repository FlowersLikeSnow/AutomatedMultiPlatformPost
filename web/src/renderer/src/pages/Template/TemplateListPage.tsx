import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Input, Tag, Space, Popconfirm, message } from 'antd'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { templateApi } from '../../api/templates'
import type { PostTemplate } from '../../types'

export function TemplateListPage(): React.ReactElement {
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await templateApi.getList() as { code: number; data?: { items: PostTemplate[] } }
      if (res.code === 200 && res.data) {
        setTemplates(res.data.items)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await templateApi.delete(id)
      message.success('删除成功')
      loadTemplates()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Tag>{v}</Tag> },
    { title: '图片风格', dataIndex: 'image_style', key: 'image_style' },
    { title: '默认', dataIndex: 'is_default', key: 'is_default', render: (v: number) => v ? <Tag color="green">是</Tag> : '否' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: PostTemplate) => (
        <Space>
          <Button type="link" icon={<Edit size={14} />} onClick={() => navigate(`/templates/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<Trash2 size={14} />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const filtered = templates.filter((t) => t.name.includes(search))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">模板管理</h2>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => navigate('/templates/create')}>新建模板</Button>
      </div>
      <Input prefix={<Search size={14} />} placeholder="搜索模板" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <Table<PostTemplate> dataSource={filtered} columns={columns} rowKey="id" loading={loading} />
    </div>
  )
}
