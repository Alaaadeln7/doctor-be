import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MultiLangString {
  @ApiProperty({ example: 'plan' })
  @IsString()
  @MinLength(3)
  en: string;

  @ApiProperty({ example: 'خطة' })
  @IsString()
  @MinLength(3)
  ar: string;
}

class MultiLangText {
  @ApiProperty({ example: 'plan description' })
  @IsString()
  @MinLength(10)
  en: string;

  @ApiProperty({ example: 'وصف الخطة' })
  @IsString()
  @MinLength(10)
  ar: string;
}

export enum PlanType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class addPlanDto {
  @ApiProperty({ type: MultiLangString })
  @ValidateNested()
  @Type(() => MultiLangString)
  title: MultiLangString;

  @ApiProperty({ type: MultiLangText })
  @ValidateNested()
  @Type(() => MultiLangText)
  description: MultiLangText;

  @ApiProperty({
    enum: PlanType,
    enumName: 'PlanType',
    description: 'Subscription plan type',
    example: PlanType.MONTHLY,
  })
  @IsEnum(PlanType, { message: 'Type must be either monthly or yearly' })
  type: PlanType;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  yearlyPrice: number;
}

export class updatePlanDto {
  @ApiProperty({ type: MultiLangString })
  @ValidateNested()
  @Type(() => MultiLangString)
  title: MultiLangString;

  @ApiProperty({ type: MultiLangText })
  @ValidateNested()
  @Type(() => MultiLangText)
  description: MultiLangText;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0)
  yearlyPrice: number;
}
