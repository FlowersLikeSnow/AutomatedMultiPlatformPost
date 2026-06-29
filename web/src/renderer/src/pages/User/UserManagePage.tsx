import { useState, useEffect } from 'react'
import { Table, Button, Input, Tag, Space, Modal, Form, Select, message, Popconfirm } from 'antd'
import { Search, Plus, Edit, Key } from 'lucide-react'
import { userApi } from '../../api/users'
import type { UserInfo } from '../../types'
import dayjs from 'dayjs'

export function UserManagePage(): React.ReactElement {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserInfo | null>(null)
  const [form] = Form.useForm()

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await userApi.getList({ keyword: search }) as { code: number; data?: { items: UserInfo[] } }
      if (res.code === 200 && res.data) setUsers(res.data.items)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleEdit = (user: UserInfo): void => {
    setEditUser(user)
    form.setFieldsValue(user)
    setModalOpen(true)
  }

  const handleCreate = (): void => {
    setEditUser(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleSubmit = async (values: Record<string, unknown>): Promise<void> => {
    try {
      if (editUser) {
        await userApi.update(editUser.id, values)
        message.success('更新成功')
      } else {
        await userApi.create(values as UserInfo & { password: string })
        message.success('创建成功')
      }
      setModalOpen(false)
      loadUsers()
    } catch { message.error('保存失败') }
  }

  const handleResetPassword = async (user: UserInfo): Promise<void> => {
    try {
      await userApi.resetPassword(user.id, '123456')
      message.success('密码已重置为 123456')
    } catch { message.error('重置失败') }
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (role: string) => {
      const colors: Record<string, string> = { super_admin: 'red', admin: 'orange', user: 'blue' }
      const labels: Record<string, string> = { super_admin: '超级管理员', admin: '管理员', user: '普通用户' }
      return <Tag color={colors[role]}>{labels[role]}</Tag>
    }},
    { title: '剩余积分', dataIndex: 'points_remaining', key: 'points_remaining' },
    { title: '消耗积分', dataIndex: 'points_consumed', key: 'points_consumed' },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '登录IP', dataIndex: 'last_login_ip', key: 'last_login_ip', render: (v: string) => v || '-' },
    { title: '操作', key: 'actions', render: (_: unknown, record: UserInfo) => (
      <Space>
        <Button type="link" icon={<Edit size={14} />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定重置密码？" onConfirm={() => handleResetPassword(record)}>
          <Button type="link" icon={<Key size={14} />}>重置</Button>
        </Popconfirm>
      </Space>
    )}
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">用户管理</h2>
        <Button type="primary" icon={<Plus size={14} />} onClick={handleCreate}>新增用户</Button>
      </div>
      <Input prefix={<Search size={14} />} placeholder="搜索用户名/手机号" value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={loadUsers} className="max-w-sm" />
      <Table<UserInfo> dataSource={users} columns={columns} rowKey="id" loading={loading} />

      <Modal title={editUser ? '编辑用户' : '新增用户'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}><Input /></Form.Item>
          {!editUser && <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item>}
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={[{ label: '超级管理员', value: 'super_admin' }, { label: '管理员', value: 'admin' }, { label: '普通用户', value: 'user' }]} />
          </Form.Item>
          <Form.Item name="points_remaining" label="剩余积分"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
