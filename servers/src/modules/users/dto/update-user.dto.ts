import { IsString, IsOptional, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsOptional()
  role?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points_remaining?: number

  @IsString()
  @IsOptional()
  status?: string
}
