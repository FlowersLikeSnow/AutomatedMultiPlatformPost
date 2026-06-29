import { IsString, IsNotEmpty, Length } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Length(11, 11, { message: '手机号格式不正确' })
  phone: string

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  captcha: string

  @IsString()
  captchaId: string
}
