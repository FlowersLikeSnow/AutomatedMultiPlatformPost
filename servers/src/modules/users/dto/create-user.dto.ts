import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  phone: string

  @IsString()
  @IsNotEmpty()
  password: string

  @IsString()
  @IsOptional()
  role?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points_remaining?: number
}
