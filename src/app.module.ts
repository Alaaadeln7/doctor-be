import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./modules/admin/admin.module";
import envConfig from "./config/env.config";
import { DbModule } from "./db/drs.db";
import { PlanModule } from "./modules/plan/plan.module";
import * as path from "path";
import { CategoryModule } from "./modules/category/category.module";
import { DoctorModule } from "./modules/doctor/doctor.module";
import { CredentialModule } from "./modules/credential/credential.module";
import { FileModule } from "./modules/file/file.module";
import { CommonModule } from "./modules/common/common.module";
import { LocationModule } from "./modules/location/location.module";
import { WorkinHoursModule } from "./modules/workin-hours/workin-hours.module";
import { MailModule } from "./mail/mail.module";

let envPath: string;

switch (process.env.NODE_ENV) {
  case "production":
    envPath = path.resolve(__dirname, "../../.env.prod");
    break;
  case "development":
    envPath = path.resolve(__dirname, "../../.env.dev");
    break;
  default:
    envPath = path.resolve(__dirname, "../../.env.dev");
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: envPath,
    }),
    MailModule,
    DbModule,
    AdminModule,
    PlanModule,
    CategoryModule,
    DoctorModule,
    CredentialModule,
    FileModule,
    CommonModule,
    LocationModule,
    WorkinHoursModule,
  ],
})
export class AppModule {}
