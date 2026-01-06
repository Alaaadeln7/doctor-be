import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Binary } from 'typeorm';

// doctor
export class DoctorProfileImgDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'img',
    description: 'doctor profile image',
  })
  @IsOptional()
  img?: Binary;

  @ApiProperty({
    type: 'string',
    name: 'favColor',
    description: 'favorite color',
    required: false,
  })
  @IsOptional()
  favColor?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'backgroundImage',
    description: 'background image',
    required: false,
  })
  @IsOptional()
  backgroundImage?: Binary;
}

export class DoctorProfileAuthFiles {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'card',
    description: 'كارت النقابه',
  })
  @IsNotEmpty()
  card: Binary;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'fid',
    description: 'front face of identity',
  })
  @IsNotEmpty()
  fid: Binary;
}

export class DoctorProfileAuthUpdateFiles {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'card',
    description: 'كارت النقابه',
    required: false,
  })
  card?: Binary;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    name: 'fid',
    description: 'front face of identity',
    required: false,
  })
  fid?: Binary;
}
