import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../..//guards/auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../..//shared/entities/categoris.entity';
import { JwtUtilService } from '../..//common/utils/jwt.utils';
import { StorageUtilService } from '../..//common/utils/storage.util';
import { CloudinaryBaseUtilService } from '../..//common/utils/cloudinary.util';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    JwtUtilService,
    StorageUtilService,
    CloudinaryBaseUtilService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
