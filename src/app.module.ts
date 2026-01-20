import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './modules/admin/admin.module';
import envConfig from './config/env.config';
import { DbModule } from './db/drs.db';
import { PlanModule } from './modules/plan/plan.module';
import { CategoryModule } from './modules/category/category.module';
import { DoctorModule } from './modules/doctor/doctor.module';

import { FileModule } from './modules/file/file.module';
import { CommonModule } from './modules/common/common.module';
import { LocationModule } from './modules/location/location.module';
import { WorkinHoursModule } from './modules/workin-hours/workin-hours.module';
import { MailModule } from './mail/mail.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ContactUsModule } from './modules/contact-us/contact-us.module';
import { CouponsModule } from './modules/coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
    MailModule,
    DbModule,
    AdminModule,
    PlanModule,
    CategoryModule,
    DoctorModule,

    FileModule,
    CommonModule,
    LocationModule,
    WorkinHoursModule,
    SubscriptionsModule,
    ContactUsModule,
    CouponsModule,
  ],
})
export class AppModule {}
