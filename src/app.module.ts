import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminModule } from "./modules/admin/admin.module";
import envConfig from "./config/env.config";
import { DbModule } from "./db/drs.db";
import { PlanModule } from "./modules/plan/plan.module";
import * as path from "path";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { CategoryModule } from "./modules/category/category.module";
import { DoctorModule } from "./modules/doctor/doctor.module";
import { CredentialModule } from "./modules/credential/credential.module";
import { FileModule } from "./modules/file/file.module";
import { CommonModule } from "./modules/common/common.module";
import { LocationModule } from "./modules/location/location.module";
import { WorkinHoursModule } from "./modules/workin-hours/workin-hours.module";

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
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // FIX: variable name clarified and types enforced
        const user = configService.get<string>("email.user");
        const pass = configService.get<string>("email.pass");

        if (!user || !pass) {
          console.warn("⚠️ Missing email credentials in environment config");
        }

        return {
          transport: {
            service: "gmail",
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: '"DRS System" <noreply@drs.com>',
          },
          template: {
            dir: path.join(__dirname, "common/templates"),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
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
