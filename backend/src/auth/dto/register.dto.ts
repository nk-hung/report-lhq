import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @Matches(/[A-Z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ in hoa' })
  @Matches(/[a-z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ thường' })
  @Matches(/[0-9]/, { message: 'Mật khẩu phải có ít nhất 1 chữ số' })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt',
  })
  password!: string;
}
