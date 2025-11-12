import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminEntity } from "../..//shared/entities/admins.entity";
import { BcryptUtilService } from "../..//common/utils/bcrypt.util";
import { CheckAdminExistPipe } from "../../common/pipes/check.pipes";
import { JwtUtilService } from "../..//common/utils/jwt.utils";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { CustomThrottlerGuard } from "../../common/guards/throttle.quard";
import { MailUtilService } from "../../common/utils/mail.util";
import { OtpUtilService } from "../../common/utils/otp.util";
import { MailModule } from "../../mail/mail.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity]),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    MailModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    BcryptUtilService,
    CheckAdminExistPipe,
    MailUtilService,
    OtpUtilService,
    JwtUtilService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AdminModule {}
