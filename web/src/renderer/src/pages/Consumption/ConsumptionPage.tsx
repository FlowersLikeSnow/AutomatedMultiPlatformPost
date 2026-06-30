import { useState, useEffect } from 'react'
import { Table, Tag, DatePicker, Select, Space, Card } from 'antd'
import { consumptionApi } from '../../api/consumption'
import type { ConsumptionRecord } from '../../types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const typeLabels: Record<string, string> = { post: '发帖', redeem: '兑换', admin_adjust: '管理员调整', refund: '退款' }
const typeColors: Record<string, string> = { post: 'blue', redeem: 'green', admin_adjust: 'orange', refund: 'red' }

export function ConsumptionPage(): React.ReactElement {
  const [records, setRecords] = useState<ConsumptionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  useEffect(() => { loadRecords() }, [dateRange, typeFilter])

  const loadRecords = async (): Promise<void> => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (dateRange?.[0]) params.startDate = dateRange[0].toISOString()
      if (dateRange?.[1]) params.endDate = dateRange[1].toISOString()
      if (typeFilter) params.type = typeFilter

      const res = await consumptionApi.getList(params) as { code: number; data?: { items: ConsumptionRecord[] } }
      if (res.code === 200 && res.data) setRecords(res.data.items)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const columns = [
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t]}</Tag> },
    { title: '积分变动', dataIndex: 'points', key: 'points', render: (v: number) => <span className={v > 0 ? 'text-green-500' : 'text-red-500'}>{v > 0 ? `+${v}` : v}</span> },
    { title: '余额', dataIndex: 'balance_after', key: 'balance_after' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') }
  ]

  return (
    <Card className="h-full" title="消费记录">
      <Space wrap className="mb-4">
        <RangePicker onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)} />
        <Select placeholder="类型筛选" allowClear style={{ width: 150 }} onChange={setTypeFilter}
          options={Object.entries(typeLabels).map(([k, v]) => ({ label: v, value: k }))} />
      </Space>
      <Table<ConsumptionRecord> dataSource={records} columns={columns} rowKey="id" loading={loading} />
    </Card>
  )
}
