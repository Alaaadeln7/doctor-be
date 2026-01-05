import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateContactUsDto {
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  @ApiProperty({
    name: 'name',
    description: 'your name with min 3 chars',
    type: 'string',
    required: true,
  })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    name: 'email',
    description: 'your email',
    type: 'string',
    required: true,
  })
  email: string;

  @ApiProperty({
    name: 'message',
    description: 'your message',
    type: 'string',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
