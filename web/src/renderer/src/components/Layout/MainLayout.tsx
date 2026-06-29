import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function MainLayout(): React.ReactElement {
  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
