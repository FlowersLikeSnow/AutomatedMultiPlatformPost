import { useState, useEffect } from 'react'
import { Card, Button, Tag, message, Spin } from 'antd'
import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import type { PlatformCode, PlatformUserInfo, PlatformAccountStatus } from '@shared/types'
import { platformStore, setPlatformAccount, isPlatformLoggedIn } from '../../stores/platformStore'
import { useSnapshot } from 'valtio'

interface PlatformConfig {
  code: PlatformCode
  name: string
  color: string
  loginUrl: string
}

const platforms: PlatformConfig[] = [
  { code: 'xiaohongshu', name: '小红书', color: '#ff2442', loginUrl: 'https://creator.xiaohongshu.com/login' },
  { code: 'douyin', name: '抖音', color: '#000000', loginUrl: 'https://creator.douyin.com' },
  { code: 'kuaishou', name: '快手', color: '#ff4906', loginUrl: 'https://cp.kuaishou.com' }
]

function getPlatformApi(code: PlatformCode) {
  return window.app?.[code]
}

export function PlatformManagePage(): React.ReactElement {
  const { accounts, loading } = useSnapshot(platformStore)
  const [operating, setOperating] = useState<Record<string, boolean>>({})

  const handleLogin = async (code: PlatformCode): Promise<void> => {
    setOperating((prev) => ({ ...prev, [code]: true }))
    try {
      const api = getPlatformApi(code)
      if (!api) {
        message.error('平台 API 不可用')
        return
      }
      const res = await api.login()
      if (res.success && res.data) {
        const userInfo = res.data as unknown as PlatformUserInfo
        setPlatformAccount(code, {
          id: code,
          platform_id: code,
          platform_code: code,
          platform_name: platforms.find((p) => p.code === code)?.name,
          user_info_json: JSON.stringify(userInfo),
          status: 'online' as PlatformAccountStatus,
          logged_in_at: new Date().toISOString()
        })
        message.success(`${platforms.find((p) => p.code === code)?.name} 登录成功`)
      } else {
        message.error(res.error || '登录失败')
      }
    } catch {
      message.error('登录出错')
    } finally {
      setOperating((prev) => ({ ...prev, [code]: false }))
    }
  }

  const handleLogout = async (code: PlatformCode): Promise<void> => {
    const api = getPlatformApi(code)
    if (!api) return
    await api.logout()
    setPlatformAccount(code, null)
    message.success('已登出')
  }

  const getStatusColor = (code: PlatformCode): string => {
    if (isPlatformLoggedIn(code)) return 'green'
    return 'default'
  }

  const getStatusText = (code: PlatformCode): string => {
    if (isPlatformLoggedIn(code)) return '在线'
    return '离线'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">平台管理</h2>
      <Spin spinning={loading}>
        <div className="grid grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const loggedIn = isPlatformLoggedIn(platform.code)
            const userInfo = accounts[platform.code]
              ? JSON.parse(accounts[platform.code]!.user_info_json || '{}')
              : null

            return (
              <Card key={platform.code} className="text-center">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.name[0]}
                </div>
                <h3 className="text-lg font-medium mb-2">{platform.name}</h3>
                <Tag color={getStatusColor(platform.code)} className="mb-4">
                  {getStatusText(platform.code)}
                </Tag>

                {userInfo?.nickname && (
                  <p className="text-sm text-gray-500 mb-4">{userInfo.nickname}</p>
                )}

                <div className="flex gap-2 justify-center">
                  {loggedIn ? (
                    <Button
                      icon={<LogOut size={14} />}
                      onClick={() => handleLogout(platform.code)}
                      loading={operating[platform.code]}
                    >
                      登出
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<LogIn size={14} />}
                      onClick={() => handleLogin(platform.code)}
                      loading={operating[platform.code]}
                    >
                      登录
                    </Button>
                  )}
                  <Button
                    icon={<RefreshCw size={14} />}
                    onClick={() => handleLogin(platform.code)}
                    loading={operating[platform.code]}
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </Spin>
    </div>
  )
}
