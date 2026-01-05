import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactUsService } from './contact-us.service';
import { ContactUsController } from './contact-us.controller';
import { ContactUs } from './entities/contact-us.entity';
import { AdminEntity } from '../../shared/entities/admins.entity';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import { AuthGuard } from '../../guards/auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContactUs, AdminEntity]), MailModule],
  controllers: [ContactUsController],
  providers: [ContactUsService, JwtUtilService, AuthGuard, AdminGuard],
  exports: [ContactUsService],
})
export class ContactUsModule {}
