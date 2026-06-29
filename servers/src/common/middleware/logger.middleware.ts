import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const start = Date.now()
    const { method, originalUrl } = req

    _res.on('finish', () => {
      const ms = Date.now() - start
      console.log(`${method} ${originalUrl} ${_res.statusCode} - ${ms}ms`)
    })

    next()
  }
}
