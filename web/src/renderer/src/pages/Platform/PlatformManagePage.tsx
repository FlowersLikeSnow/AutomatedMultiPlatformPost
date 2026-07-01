import { useState, useEffect } from 'react'
import { Card, Button, Tag, App, Spin } from 'antd'
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
  const { message } = App.useApp()

  const handleLogin = async (code: PlatformCode): Promise<void> => {
    setOperating((prev) => ({ ...prev, [code]: true }))
    try {
      const api = getPlatformApi(code)
      if (!api) {
        message.error('平台 API 不可用')
        return
      }
      const res = await api.login()
      if (res.code === 200 && res.data) {
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
        message.error(res.msg || '登录失败')
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

  const handleCheckLogin = async (code: PlatformCode): Promise<void> => {
    setOperating((prev) => ({ ...prev, [code]: true }))
    try {
      const api = getPlatformApi(code)
      if (!api) {
        message.error('平台 API 不可用')
        return
      }
      const res = await api.checkLoginStatus()
      if (res.code === 200 && res.data?.loggedIn) {
        // 已登录，获取用户信息并更新状态
        const userInfoRes = await api.getUserInfo()
        if (userInfoRes.code === 200 && userInfoRes.data) {
          const userInfo = userInfoRes.data as unknown as PlatformUserInfo
          setPlatformAccount(code, {
            id: code,
            platform_id: code,
            platform_code: code,
            platform_name: platforms.find((p) => p.code === code)?.name,
            user_info_json: JSON.stringify(userInfo),
            status: 'online' as PlatformAccountStatus,
            logged_in_at: new Date().toISOString()
          })
          message.success(`${platforms.find((p) => p.code === code)?.name} 已登录`)
        }
      } else {
        message.warning(`${platforms.find((p) => p.code === code)?.name} 未登录`)
      }
    } catch {
      message.error('检测登录状态出错')
    } finally {
      setOperating((prev) => ({ ...prev, [code]: false }))
    }
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
    <Card className="h-full" title="平台管理">
      <Spin spinning={loading}>
        <div className="grid grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const loggedIn = isPlatformLoggedIn(platform.code)
            const userInfo = accounts[platform.code]
              ? JSON.parse(accounts[platform.code]!.user_info_json || '{}')
              : null

            return (
              <div
                key={platform.code}
                className="text-center p-4 rounded-lg border border-(--border-color) bg-(--bg-color)"
              >
                <div
                  className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-3"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.name[0]}
                </div>
                <h3 className="text-base font-medium mb-1.5">{platform.name}</h3>
                <Tag color={getStatusColor(platform.code)} className="mb-3">
                  {getStatusText(platform.code)}
                </Tag>

                {userInfo?.nickname && (
                  <p className="text-sm text-(--text-color)/50 mb-3">{userInfo.nickname}</p>
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
                    onClick={() => handleCheckLogin(platform.code)}
                    loading={operating[platform.code]}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Spin>
    </Card>
  )
}
