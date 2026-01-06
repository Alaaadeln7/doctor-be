import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { AdminEntity } from '../../shared/entities/admins.entity';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { PlanEntity } from '../../shared/entities/plans.entity';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import { AuthGuard } from '../../guards/auth.guard';
import { AdminGuard } from '../../guards/admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, AdminEntity, DoctorEntity, PlanEntity])],
  controllers: [CouponsController],
  providers: [CouponsService, JwtUtilService, AuthGuard, AdminGuard],
  exports: [CouponsService],
})
export class CouponsModule {}
