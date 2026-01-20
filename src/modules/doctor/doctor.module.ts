import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { PlanModule } from '../plan/plan.module';
import { CategoryModule } from '../category/category.module';
import { WorkingHoursEntity } from '../../shared/entities/workinHours.entity';
import { MailModule } from '../../mail/mail.module';
import { DoctorProvider } from './doctor.provider';
import { StorageUtilService } from 'src/common/utils/storage.util';
import { CloudinaryBaseUtilService } from 'src/common/utils/cloudinary.util';
import { CodeUtilService } from 'src/common/utils/code.util';
import { OtpUtilService } from 'src/common/utils/otp.util';
import { JwtUtilService } from 'src/common/utils/jwt.utils';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorEntity, WorkingHoursEntity]),
    PlanModule,
    CategoryModule,
    MailModule,
  ],
  controllers: [DoctorController],
  providers: [
    DoctorService,
    DoctorProvider,
    StorageUtilService,
    CloudinaryBaseUtilService,
    CodeUtilService,
    OtpUtilService,
    JwtUtilService,
  ],
  exports: [DoctorService, DoctorProvider],
})
export class DoctorModule {}
