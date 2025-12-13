import { IsString, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreateCityDto {
  @IsInt()
  @IsPositive()
  governorate_id: number;

  @IsString()
  @MinLength(2)
  city_name_ar: string;

  @IsString()
  @MinLength(2)
  city_name_en: string;
}
