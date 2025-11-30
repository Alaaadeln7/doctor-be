import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from "./common.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminEntity } from "../../shared/entities/admins.entity";
import { DoctorEntity } from "../../shared/entities/doctors.entity";
import { OtpUtilService } from "../../common/utils/otp.util";
import { CategoryEntity } from "../../shared/entities/categoris.entity";
import { CategoryService } from "../category/category.service";
import { LocationService } from "../location/location.service";
import { MailModule } from "../../mail/mail.module";
import { GovernorateEntity } from "../../shared/entities/governorate.entity";
import { CityEntity } from "../../shared/entities/city.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminEntity,
      DoctorEntity,
      CategoryEntity,
      GovernorateEntity,
      CityEntity,
    ]),
    MailModule,
  ],
  providers: [CommonService, OtpUtilService, CategoryService, LocationService],
  controllers: [CommonController],
})
export class CommonModule {}
