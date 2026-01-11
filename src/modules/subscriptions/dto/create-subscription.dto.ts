import {  IsBoolean, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'User ID (Doctor ID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Plan ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Is subscription active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Subscription expiration date', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  expireAt: Date;

  @ApiPropertyOptional({ description: 'Type of plan', example: 'premium' })
  @IsString()
  @IsOptional()
  typePlan?: string;
}
