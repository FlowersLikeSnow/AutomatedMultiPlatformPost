import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let code = HttpStatus.INTERNAL_SERVER_ERROR
    let msg = '服务器内部错误'

    if (exception instanceof HttpException) {
      code = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'string') {
        msg = exceptionResponse
      } else {
        const res = exceptionResponse as Record<string, unknown>
        msg = (res.message as string) || exception.message
      }
    } else if (exception instanceof Error) {
      msg = exception.message
    }

    response.status(code).json({
      code,
      msg
    })
  }
}
