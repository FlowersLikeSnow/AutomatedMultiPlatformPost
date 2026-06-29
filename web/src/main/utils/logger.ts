import { app } from 'electron'
import { resolve } from 'path'
import { existsSync, mkdirSync, appendFileSync, createReadStream } from 'fs'
import { EOL } from 'os'

class Logger {
  private logDir: string
  private logFile: string

  constructor() {
    this.logDir = resolve(app.getPath('userData'), 'logs')
    this.logFile = resolve(this.logDir, 'app.log')

    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private formatMessage(level: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString()
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
    return `[${timestamp}] [${level}] ${message}`
  }

  private writeToFile(message: string): void {
    try {
      appendFileSync(this.logFile, message + EOL)
    } catch {
      // ignore write errors
    }
  }

  info(...args: unknown[]): void {
    const message = this.formatMessage('INFO', ...args)
    console.log(message)
    this.writeToFile(message)
  }

  warn(...args: unknown[]): void {
    const message = this.formatMessage('WARN', ...args)
    console.warn(message)
    this.writeToFile(message)
  }

  error(...args: unknown[]): void {
    const message = this.formatMessage('ERROR', ...args)
    console.error(message)
    this.writeToFile(message)
  }

  debug(...args: unknown[]): void {
    const message = this.formatMessage('DEBUG', ...args)
    console.debug(message)
    this.writeToFile(message)
  }

  getLogPath(): string {
    return this.logFile
  }

  getLogContent(): string {
    if (!existsSync(this.logFile)) {
      return ''
    }
    const stream = createReadStream(this.logFile, { encoding: 'utf-8' })
    let content = ''
    stream.on('data', (chunk) => {
      content += chunk
    })
    return content
  }
}

export const logger = new Logger()
