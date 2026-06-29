import { Outlet } from 'react-router-dom'
import { TitleBar } from './TitleBar'

export function RootLayout(): React.ReactElement {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-color)]">
      <TitleBar />
      <Outlet />
    </div>
  )
}
