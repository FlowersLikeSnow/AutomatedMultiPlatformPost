import { useState, useEffect } from 'react'
import { Card, Form, InputNumber, Button, Switch, message, Divider, Tag } from 'antd'
import { useSnapshot } from 'valtio'
import { uiStore, setTheme } from '../../stores/uiStore'
import { authStore } from '../../stores/authStore'

interface SettingsForm {
  pointsPerPost: number
}

export function SettingsPage(): React.ReactElement {
  const { theme } = useSnapshot(uiStore)
  const { currentUser } = useSnapshot(authStore)
  const [form] = Form.useForm<SettingsForm>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    form.setFieldsValue({ pointsPerPost: 5 })
  }, [form])

  const handleSave = async (values: SettingsForm): Promise<void> => {
    setSaving(true)
    try {
      // TODO: Call backend API to save settings
      message.success('设置已保存')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = (checked: boolean): void => {
    setTheme(checked ? 'dark' : 'light')
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold">设置</h2>

      <Card title="外观设置">
        <div className="flex items-center justify-between">
          <span>深色模式</span>
          <Switch checked={theme === 'dark'} onChange={handleThemeChange} />
        </div>
      </Card>

      <Card title="积分规则">
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="pointsPerPost"
            label="每次发帖消耗积分"
            rules={[{ required: true, message: '请输入每次发帖消耗的积分' }]}
          >
            <InputNumber min={1} max={1000} className="w-full" addonAfter="积分/次" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="系统信息">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">当前用户</span>
            <span>{currentUser?.username || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">角色</span>
            <Tag color={currentUser?.role === 'super_admin' ? 'red' : currentUser?.role === 'admin' ? 'orange' : 'blue'}>
              {currentUser?.role === 'super_admin' ? '超级管理员' : currentUser?.role === 'admin' ? '管理员' : '普通用户'}
            </Tag>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">剩余积分</span>
            <span className="text-[var(--primary-color)] font-medium">{currentUser?.points_remaining ?? 0}</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">应用版本</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Electron</span>
            <span>{(window as Record<string, unknown>)?.process?.versions?.electron || '-'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
