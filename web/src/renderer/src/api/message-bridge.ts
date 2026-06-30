import type { MessageInstance } from 'antd/es/message/interface'

let messageInstance: MessageInstance | null = null

export function setMessageInstance(instance: MessageInstance): void {
  messageInstance = instance
}

export function showMessage(type: 'success' | 'error' | 'warning' | 'info', content: string): void {
  if (messageInstance) {
    messageInstance[type](content)
  }
}
