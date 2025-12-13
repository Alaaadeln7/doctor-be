/* eslint-disable */

import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { GovernorateEntity } from '../../shared/entities/governorate.entity';
import { Repository } from 'typeorm';
import { CreateGovernorateDto } from './dtos/create.governorates.dto';
import { UpdateGovernorateDto } from './dtos/update.governorates.dto';
import { CityEntity } from '../../shared/entities/city.entity';
import { CreateCityDto } from './dtos/create-city.dto';
import { UpdateCityDto } from './dtos/update-city.dto';
@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(GovernorateEntity)
    private readonly governorateRepo: Repository<GovernorateEntity>,
    @InjectRepository(CityEntity)
    private readonly cityRepo: Repository<CityEntity>,
  ) {}

  async getAllGovernorates() {
    const allGovernorates = await this.governorateRepo.find();

    return allGovernorates;
  }

  async createNewGovernorate(governorateData: CreateGovernorateDto) {
    const newGovernorate = this.governorateRepo.create(governorateData);
    return this.governorateRepo.save(newGovernorate);
  }

  async deleteGovernorate(id: number) {
    return this.governorateRepo.delete(id);
  }

  async updateGovernorate(id: number, governorateData: UpdateGovernorateDto) {
    return this.governorateRepo.update(id, governorateData);
  }

  async getAllCities() {
    const allCities = await this.cityRepo.find();
    return allCities;
  }

  async createCity(createCityDto: CreateCityDto) {
    const governorate = await this.governorateRepo.findOne({
      where: { id: createCityDto.governorate_id },
    });

    if (!governorate) {
      throw new NotFoundException(`Governorate with id ${createCityDto.governorate_id} not found`);
    }

    const city = this.cityRepo.create(createCityDto);
    return await this.cityRepo.save(city);
  }

  async deleteCity(id: number) {
    return this.cityRepo.delete(id);
  }

  async updateCity(id: number, cityData: UpdateCityDto) {
    return this.cityRepo.update(id, cityData);
  }

  async getCitiesByGovernorateId(governorateId: number) {
    const cities = await this.cityRepo.find({
      where: { governorate_id: governorateId },
    });
    return cities;
  }
}
