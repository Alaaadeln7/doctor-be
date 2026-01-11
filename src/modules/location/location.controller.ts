import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LocationService } from './location.service';
import { CreateGovernorateDto } from './dtos/create.governorates.dto';
import { UpdateGovernorateDto } from './dtos/update.governorates.dto';
import { CreateCityDto } from './dtos/create-city.dto';
import { UpdateCityDto } from './dtos/update-city.dto';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // ========================= Governorates =========================

  @Get('governorates')
  @Public()
  getAllGovernorates(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.locationService.getAllGovernorates({ page, limit });
  }

  @Post('governorates')
  @Public()
  createGovernorate(@Body() dto: CreateGovernorateDto) {
    return this.locationService.createNewGovernorate(dto);
  }

  @Put('governorates/:id')
  @Public()
  updateGovernorate(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGovernorateDto) {
    return this.locationService.updateGovernorate(id, dto);
  }

  @Delete('governorates/:id')
  @Public()
  deleteGovernorate(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.deleteGovernorate(id);
  }

  @Get('governorates/:id/cities')
  @Public()
  getGovernorateCities(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.getCitiesByGovernorateId(id);
  }

  // ========================= Cities =========================

  @Get('cities')
  @Public()
  getAllCities(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.locationService.getAllCities({ page, limit });
  }

  @Post('cities')
  @Public()
  createCity(@Body() dto: CreateCityDto) {
    return this.locationService.createCity(dto);
  }

  @Put(':id')
  @Public()
  updateCity(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCityDto) {
    return this.locationService.updateCity(id, dto);
  }

  @Delete(':id')
  @Public()
  deleteCity(@Param('id', ParseIntPipe) id: number) {
    return this.locationService.deleteCity(id);
  }
}
