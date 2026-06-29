import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { User, Lock, ShieldCheck } from 'lucide-react'
import { CaptchaCanvas } from '../../components/Login/CaptchaCanvas'
import { authApi } from '../../api/auth'
import { setUser } from '../../stores/authStore'
import { initPoints } from '../../stores/pointsStore'

export function AuthLoginPage(): React.ReactElement {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [captchaCode, setCaptchaCode] = useState('')
  const navigate = useNavigate()

  const handleLogin = useCallback(
    async (values: { phone: string; password: string; captcha: string }) => {
      if (values.captcha.toLowerCase() !== captchaCode.toLowerCase()) {
        message.error('验证码错误')
        return
      }

      setLoading(true)
      try {
        const res = await authApi.login({
          phone: values.phone,
          password: values.password,
          captcha: values.captcha,
          captchaId: 'local'
        }) as { success: boolean; data?: { user: any; token: string }; error?: string }

        if (res.success && res.data) {
          setUser(res.data.user, res.data.token)
          initPoints()
          message.success('登录成功')
          navigate('/')
        } else {
          message.error(res.error || '登录失败')
        }
      } catch {
        message.error('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    },
    [captchaCode, navigate]
  )

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[var(--bg-color)]">
      <div className="w-[400px] p-8 rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--border-color)] shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--primary-color)]">多平台自动发帖</h1>
          <p className="text-sm text-gray-500 mt-2">请输入您的账号信息</p>
        </div>

        <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input
              prefix={<User size={16} className="text-gray-400" />}
              placeholder="手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<Lock size={16} className="text-gray-400" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div className="flex gap-3">
              <Input
                prefix={<ShieldCheck size={16} className="text-gray-400" />}
                placeholder="验证码"
                className="flex-1"
              />
              <CaptchaCanvas width={120} height={40} onChange={setCaptchaCode} />
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="h-[44px]"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
