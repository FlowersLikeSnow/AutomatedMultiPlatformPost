import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  })

  // Global prefix
  app.setGlobalPrefix('api')

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  )

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor())

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT', 3000)

  await app.listen(port)
  console.log(`Server running on http://localhost:${port}`)
}

bootstrap()
