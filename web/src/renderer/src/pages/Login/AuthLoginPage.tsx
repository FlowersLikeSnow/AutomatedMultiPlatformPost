import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import { User, Lock, ShieldCheck, Send } from 'lucide-react'
import { CaptchaCanvas } from '../../components/Login/CaptchaCanvas'
import { authApi } from '../../api/auth'
import { setUser } from '../../stores/authStore'
import { initPoints } from '../../stores/pointsStore'

const PLATFORMS = [
  { name: '小红书', color: '#ff2442' },
  { name: '抖音', color: '#000000' },
  { name: '快手', color: '#ff4906' }
]

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
        }) as { code: number; data?: { user: any; token: string }; msg?: string }

        if (res.code === 200 && res.data) {
          setUser(res.data.user, res.data.token)
          initPoints()
          message.success('登录成功')
          navigate('/')
        } else {
          message.error(res.msg || '登录失败')
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
    <div className="relative flex items-center justify-center w-screen h-screen overflow-hidden bg-(--bg-color)">
      {/* Decorative background orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--primary-color) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-125 h-125 rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--primary-color) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-105">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-(--primary-color) mb-5 shadow-lg shadow-(--primary-color)/20">
            <Send size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-[28px] font-bold text-(--text-color) tracking-tight">
            多平台自动发帖
          </h1>
          <p className="text-sm text-(--text-color)/50 mt-2">一键分发，高效运营</p>

          {/* Platform badges */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {PLATFORMS.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border-(--border-color) bg-(--bg-color) text-(--text-color)/70"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="p-8 rounded-2xl bg-(--sidebar-bg) border-(--border-color) shadow-xl shadow-black/5">
          <Form form={form} onFinish={handleLogin} layout="vertical" size="large">
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1\d{10}$/, message: '手机号格式不正确' }
              ]}
            >
              <Input
                prefix={<User size={16} className="text-(--text-color)/30" />}
                placeholder="手机号"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<Lock size={16} className="text-(--text-color)/30" />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="flex gap-3">
                <Input
                  prefix={<ShieldCheck size={16} className="text-(--text-color)/30" />}
                  placeholder="验证码"
                  className="flex-1"
                />
                <CaptchaCanvas width={120} height={40} onChange={setCaptchaCode} />
              </div>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }} className="mt-2">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="h-11 text-base font-medium"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-(--text-color)/30 mt-6">
          登录即表示同意相关服务条款
        </p>
      </div>
    </div>
  )
}
