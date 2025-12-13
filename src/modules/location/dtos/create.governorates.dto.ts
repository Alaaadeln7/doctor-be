import { IsString, MinLength } from 'class-validator';

export class CreateGovernorateDto {
  @IsString()
  @MinLength(2)
  governorate_name_ar: string;

  @IsString()
  @MinLength(2)
  governorate_name_en: string;
}
