import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernorateEntity } from '../../shared/entities/governorate.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { CityEntity } from '../../shared/entities/city.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GovernorateEntity]), TypeOrmModule.forFeature([CityEntity])],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
