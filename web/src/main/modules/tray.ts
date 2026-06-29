import { Tray, Menu, app, nativeImage } from 'electron'
import { resolve } from 'path'
import { getMainWindow } from '../index'
import { logger } from '../utils/logger'

let tray: Tray | null = null

export function initTray(): void {
  try {
    const iconPath = resolve(__dirname, '../../resources/tray-icon.png')
    const icon = nativeImage.createFromPath(iconPath)
    tray = new Tray(icon.resize({ width: 16, height: 16 }))

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          const win = getMainWindow()
          if (win) {
            win.show()
            win.focus()
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])

    tray.setToolTip('多平台自动发帖')
    tray.setContextMenu(contextMenu)

    tray.on('click', () => {
      const win = getMainWindow()
      if (win) {
        if (win.isVisible()) {
          win.focus()
        } else {
          win.show()
        }
      }
    })

    logger.info('System tray initialized')
  } catch (error) {
    logger.error('Failed to init tray:', error)
  }
}
