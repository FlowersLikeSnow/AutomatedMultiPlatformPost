import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Select, App, Card } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { templateApi } from '../../api/templates'
import type { PostTemplate } from '../../types'

const categories = ['美食', '旅行', '穿搭', '数码', '生活', '通用']
const imageStyles = ['清新', '商务', '可爱', '科技', '自然', '复古', '极简']

export function TemplateEditPage(): React.ReactElement {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { message } = App.useApp()

  useEffect(() => {
    if (isEdit) {
      loadTemplate()
    }
  }, [id])

  const loadTemplate = async (): Promise<void> => {
    try {
      const res = await templateApi.getById(id!) as { code: number; data?: PostTemplate }
      if (res.code === 200 && res.data) {
        form.setFieldsValue({
          ...res.data,
          hashtags: JSON.parse(res.data.hashtags || '[]')
        })
      }
    } catch {
      message.error('加载模板失败')
    }
  }

  const handleSubmit = async (values: Record<string, unknown>): Promise<void> => {
    setLoading(true)
    try {
      const data = {
        ...values,
        hashtags: JSON.stringify(values.hashtags || [])
      }
      if (isEdit) {
        await templateApi.update(id!, data)
        message.success('更新成功')
      } else {
        await templateApi.create(data)
        message.success('创建成功')
      }
      navigate('/templates')
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full"
      title={isEdit ? '编辑模板' : '新建模板'}
      extra={<Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/templates')}>返回</Button>}>
      <Form form={form} onFinish={handleSubmit} layout="vertical" className="max-w-2xl">
        <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
          <Input placeholder="输入模板名称" />
        </Form.Item>
        <Form.Item name="text_prompt" label="文案提示词" rules={[{ required: true, message: '请输入文案提示词' }]}>
          <Input.TextArea rows={4} placeholder="描述你想要生成的内容，AI 会根据这个提示词生成文案" />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select placeholder="选择分类" options={categories.map((c) => ({ label: c, value: c }))} />
        </Form.Item>
        <Form.Item name="image_style" label="图片风格">
          <Select placeholder="选择图片风格" options={imageStyles.map((s) => ({ label: s, value: s }))} />
        </Form.Item>
        <Form.Item name="hashtags" label="话题标签">
          <Select mode="tags" placeholder="输入标签后回车添加" tokenSeparators={[',']} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="mr-2">
            {isEdit ? '保存' : '创建'}
          </Button>
          <Button onClick={() => navigate('/templates')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
