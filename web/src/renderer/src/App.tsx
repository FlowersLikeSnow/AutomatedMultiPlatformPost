import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme as antTheme, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useSnapshot } from 'valtio'
import { uiStore } from './stores/uiStore'
import { authStore } from './stores/authStore'
import { setMessageInstance } from './api/message-bridge'
import { RootLayout } from './components/Layout/RootLayout'
import { MainLayout } from './components/Layout/MainLayout'
import { ProtectedRoute } from './components/Login/ProtectedRoute'
import { AdminRoute } from './components/Login/AdminRoute'
import { AuthLoginPage } from './pages/Login/AuthLoginPage'
import { HomePage } from './pages/Home/HomePage'
import { PlatformManagePage } from './pages/Platform/PlatformManagePage'
import { TemplateListPage } from './pages/Template/TemplateListPage'
import { TemplateEditPage } from './pages/Template/TemplateEditPage'
import { OneClickPostPage } from './pages/Post/OneClickPostPage'
import { UserManagePage } from './pages/User/UserManagePage'
import { RedeemManagePage } from './pages/Redeem/RedeemManagePage'
import { ConsumptionPage } from './pages/Consumption/ConsumptionPage'
import { SettingsPage } from './pages/Settings/SettingsPage'

function MessageBridge(): null {
  const { message } = AntdApp.useApp()
  useEffect(() => {
    setMessageInstance(message)
  }, [message])
  return null
}

function App(): React.ReactElement {
  const { theme } = useSnapshot(uiStore)
  const { isAuthenticated } = useSnapshot(authStore)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#14b8a6',
          borderRadius: 8
        }
      }}
    >
      <AntdApp>
        <MessageBridge />
        <HashRouter>
          <Routes>
            <Route
              path="/auth/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <AuthLoginPage />}
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<RootLayout />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/platform" element={<PlatformManagePage />} />
                  <Route path="/templates" element={<TemplateListPage />} />
                  <Route path="/templates/create" element={<TemplateEditPage />} />
                  <Route path="/templates/:id/edit" element={<TemplateEditPage />} />
                  <Route path="/post" element={<OneClickPostPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route element={<AdminRoute />}>
                    <Route path="/users" element={<UserManagePage />} />
                    <Route path="/redeem" element={<RedeemManagePage />} />
                    <Route path="/consumption" element={<ConsumptionPage />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
