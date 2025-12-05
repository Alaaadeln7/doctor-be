import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";

class Time {
  @ApiProperty({ example: "09:00" })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ example: "17:00" })
  @IsString()
  @IsNotEmpty()
  to: string;
}

export class AddWoringHourDto {
  @ApiProperty({
    type: String,
    required: true,
  })
  @ValidateNested()
  @Type(() => String)
  day: string;

  @ApiProperty({
    type: Time,
    required: true,
  })
  @ValidateNested()
  @Type(() => Time)
  time: Time;
}
