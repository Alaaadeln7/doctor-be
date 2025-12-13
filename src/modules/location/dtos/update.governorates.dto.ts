import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateGovernorateDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  governorate_name_ar?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  governorate_name_en?: string;
}
