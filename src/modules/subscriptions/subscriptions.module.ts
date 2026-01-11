import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import { AdminEntity } from '../../shared/entities/admins.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, AdminEntity])],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    JwtUtilService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
