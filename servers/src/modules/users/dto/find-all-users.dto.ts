import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class FindAllUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  role?: string
}
