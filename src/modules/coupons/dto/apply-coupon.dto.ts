import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum PlanType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'SAVE20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  planId: number;

  @ApiProperty({ enum: PlanType, example: PlanType.MONTHLY })
  @IsEnum(PlanType)
  type: PlanType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  doctorId?: number;
}
