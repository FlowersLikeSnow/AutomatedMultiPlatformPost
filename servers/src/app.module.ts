import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'path'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { PlatformsModule } from './modules/platforms/platforms.module'
import { PlatformAccountsModule } from './modules/platform-accounts/platform-accounts.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { PostsModule } from './modules/posts/posts.module'
import { RedeemModule } from './modules/redeem/redeem.module'
import { ConsumptionModule } from './modules/consumption/consumption.module'
import { AiModule } from './modules/ai/ai.module'
import { UploadModule } from './modules/upload/upload.module'
import { SettingsModule } from './modules/settings/settings.module'
import { LoggerMiddleware } from './common/middleware/logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '.ENV')
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PlatformsModule,
    PlatformAccountsModule,
    TemplatesModule,
    PostsModule,
    RedeemModule,
    ConsumptionModule,
    AiModule,
    UploadModule,
    SettingsModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
