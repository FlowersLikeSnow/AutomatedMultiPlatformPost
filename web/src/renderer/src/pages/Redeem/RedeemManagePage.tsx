import { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Modal, Form, InputNumber, DatePicker, App, Card } from 'antd'
import { Plus, Copy } from 'lucide-react'
import { redeemApi } from '../../api/redeem'
import type { RedeemCode } from '../../types'
import dayjs from 'dayjs'

export function RedeemManagePage(): React.ReactElement {
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => { loadCodes() }, [])

  const loadCodes = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await redeemApi.getList() as { code: number; data?: { items: RedeemCode[] } }
      if (res.code === 200 && res.data) setCodes(res.data.items)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleCreate = async (values: { pointsValue: number; expiresAt?: dayjs.Dayjs; count?: number }): Promise<void> => {
    try {
      await redeemApi.create({
        pointsValue: values.pointsValue,
        expiresAt: values.expiresAt?.toISOString(),
        count: values.count || 1
      })
      message.success('创建成功')
      setModalOpen(false)
      form.resetFields()
      loadCodes()
    } catch { message.error('创建失败') }
  }

  const statusColors: Record<string, string> = { unused: 'green', used: 'default', expired: 'red' }
  const statusLabels: Record<string, string> = { unused: '未使用', used: '已使用', expired: '已过期' }

  const columns = [
    { title: '兑换码', dataIndex: 'code', key: 'code', render: (code: string) => (
      <Space>
        <span className="font-mono">{code}</span>
        <Button type="text" size="small" icon={<Copy size={12} />} onClick={() => { navigator.clipboard.writeText(code); message.success('已复制') }} />
      </Space>
    )},
    { title: '积分值', dataIndex: 'points_value', key: 'points_value' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '使用者', dataIndex: 'used_by_name', key: 'used_by_name', render: (v: string) => v || '-' },
    { title: '使用时间', dataIndex: 'used_at', key: 'used_at', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '过期时间', dataIndex: 'expires_at', key: 'expires_at', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD') : '永久' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD') }
  ]

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">券码管理</h2>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>创建券码</Button>
      </div>
      <Table<RedeemCode> dataSource={codes} columns={columns} rowKey="id" loading={loading} />

      <Modal title="创建兑换码" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="pointsValue" label="积分值" rules={[{ required: true, message: '请输入积分值' }]}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="count" label="生成数量" initialValue={1}>
            <InputNumber min={1} max={100} className="w-full" />
          </Form.Item>
          <Form.Item name="expiresAt" label="过期时间">
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
