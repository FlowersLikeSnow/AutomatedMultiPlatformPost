import { Module } from '@nestjs/common'
import { ConsumptionController } from './consumption.controller'
import { ConsumptionService } from './consumption.service'

@Module({ controllers: [ConsumptionController], providers: [ConsumptionService] })
export class ConsumptionModule {}
