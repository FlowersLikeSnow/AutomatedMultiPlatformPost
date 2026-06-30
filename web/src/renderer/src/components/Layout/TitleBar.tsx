import { Minus, Maximize2, X } from 'lucide-react'

export function TitleBar(): React.ReactElement {
  const handleMinimize = (): void => {
    window.app?.minimize()
  }

  const handleMaximize = (): void => {
    window.app?.maximize()
  }

  const handleClose = (): void => {
    window.app?.close()
  }

  return (
    <div
      className="flex items-center justify-between h-9 bg-(--titlebar-bg) border-b border-(--border-color) select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center pl-3">
        <span className="text-sm font-semibold text-(--primary-color)">
          多平台自动发帖
        </span>
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-[46px] h-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-[46px] h-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <Maximize2 size={13} />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-[46px] h-full hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
