import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Table, Tag, Divider } from 'antd'
import { Send, Coins, TrendingUp, Monitor } from 'lucide-react'
import { postApi } from '../../api/posts'
import type { DashboardStats, PostRecord } from '../../types'

export function HomePage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await postApi.getStatistics() as { code: number; data?: DashboardStats }
      if (res.code === 200 && res.data) {
        setStats(res.data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '平台', dataIndex: 'platform_name', key: 'platform_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : status === 'failed' ? 'red' : 'default'}>
          {status}
        </Tag>
      )
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' }
  ]

  return (
    <Card>
      <h2 className="text-lg font-bold mb-4">首页</h2>

      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Statistic
            title="总发帖数"
            value={stats?.totalPosts ?? 0}
            prefix={<Send size={16} />}
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="积分余额"
            value={stats?.pointsBalance ?? 0}
            prefix={<Coins size={16} />}
            valueStyle={{ color: '#14b8a6' }}
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已消耗积分"
            value={stats?.pointsConsumed ?? 0}
            prefix={<TrendingUp size={16} />}
            loading={loading}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平台状态"
            value={stats?.platformStatus?.filter((p) => p.status === 'online').length ?? 0}
            prefix={<Monitor size={16} />}
            suffix={`/ ${stats?.platformStatus?.length ?? 0}`}
            loading={loading}
          />
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />
      <h3 className="font-medium mb-3">最近发帖</h3>
      <Table<PostRecord>
        dataSource={stats?.recentPosts ?? []}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        loading={loading}
      />
    </Card>
  )
}
