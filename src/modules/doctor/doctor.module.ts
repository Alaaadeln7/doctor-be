import { Module } from "@nestjs/common";
import { DoctorService } from "./doctor.service";
import { DoctorController } from "./doctor.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DoctorEntity } from "../../shared/entities/doctors.entity";
import { PlanModule } from "../plan/plan.module";
import { CredentialModule } from "../credential/credential.module";
import { BcryptUtilService } from "../../common/utils/bcrypt.util";
import { CodeUtilService } from "../../common/utils/code.util";
import { JwtUtilService } from "../../common/utils/jwt.utils";
import { OtpUtilService } from "../../common/utils/otp.util";
import { CategoryModule } from "../category/category.module";
import { WorkingHoursEntity } from "../../shared/entities/workinHours.entity";
import { MailModule } from "../../mail/mail.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorEntity, WorkingHoursEntity]),
    PlanModule,
    CredentialModule,
    CategoryModule,
    MailModule,
  ],
  controllers: [DoctorController],
  providers: [
    DoctorService,
    BcryptUtilService,
    CodeUtilService,
    JwtUtilService,
    OtpUtilService,
    BcryptUtilService,
  ],
})
export class DoctorModule {}
