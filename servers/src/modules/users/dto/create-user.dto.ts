import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator'

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

  @IsNumber()
  @IsOptional()
  @Min(0)
  points_remaining?: number
}
