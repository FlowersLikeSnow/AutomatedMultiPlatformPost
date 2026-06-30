import { useState, useEffect } from 'react'
import { Card, Form, InputNumber, Button, Switch, App, Divider, Tag } from 'antd'
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
  const { message } = App.useApp()

  useEffect(() => {
    form.setFieldsValue({ pointsPerPost: 5 })
  }, [form])

  const handleSave = async (values: SettingsForm): Promise<void> => {
    setSaving(true)
    try {
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
    <Card className="h-full" title="设置">

      <div className="mb-4 pb-4 border-b border-(--border-color)">
        <h3 className="font-medium mb-3">外观设置</h3>
        <div className="flex items-center justify-between">
          <span>深色模式</span>
          <Switch checked={theme === 'dark'} onChange={handleThemeChange} />
        </div>
      </div>

      {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
        <div className="mb-4 pb-4 border-b border-(--border-color)">
          <h3 className="font-medium mb-3">积分规则</h3>
          <Form form={form} onFinish={handleSave} layout="vertical" className="max-w-2xl">
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
        </div>
      )}

      <div>
        <h3 className="font-medium mb-3">系统信息</h3>
        <div className="space-y-2 text-sm max-w-2xl">
          <div className="flex justify-between">
            <span className="text-(--text-color)/50">当前用户</span>
            <span>{currentUser?.username || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-(--text-color)/50">角色</span>
            <Tag color={currentUser?.role === 'super_admin' ? 'red' : currentUser?.role === 'admin' ? 'orange' : 'blue'}>
              {currentUser?.role === 'super_admin' ? '超级管理员' : currentUser?.role === 'admin' ? '管理员' : '普通用户'}
            </Tag>
          </div>
          <div className="flex justify-between">
            <span className="text-(--text-color)/50">剩余积分</span>
            <span className="text-(--primary-color) font-medium">{currentUser?.points_remaining ?? 0}</span>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div className="flex justify-between">
            <span className="text-(--text-color)/50">应用版本</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-(--text-color)/50">Electron</span>
            <span>{(window as any)?.process?.versions?.electron || '-'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
