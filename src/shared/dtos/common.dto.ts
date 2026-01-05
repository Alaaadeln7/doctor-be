import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';

type ModelType = 'doctor' | 'admin';
export class ResendOtpCodeDto {
  @ApiProperty({
    name: 'email',
    description: 'email go here!!',
    type: 'string',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    name: 'phone',
    description: 'phone go here!!',
    type: 'string',
    required: false,
  })
  @IsPhoneNumber('EG')
  @IsOptional()
  phone?: string;

  @ApiProperty({
    name: 'model',
    description: 'for who u want to resend code!!',
    type: 'string',
    required: true,
  })
  @IsIn(['doctor', 'admin'])
  @IsNotEmpty()
  model: ModelType;
}

export class ResendOtpResponseDto {
  name: string;
  email: string;
}
