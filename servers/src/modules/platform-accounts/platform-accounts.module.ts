import { Module } from '@nestjs/common'
import { PlatformAccountsController } from './platform-accounts.controller'
import { PlatformAccountsService } from './platform-accounts.service'

@Module({ controllers: [PlatformAccountsController], providers: [PlatformAccountsService], exports: [PlatformAccountsService] })
export class PlatformAccountsModule {}
