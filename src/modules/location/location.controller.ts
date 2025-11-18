import { Controller, Get, Param } from "@nestjs/common";
import { LocationService } from "./location.service";
import { Public } from "../../common/decorators/public.decorator";
import { ApiParam } from "@nestjs/swagger";

@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get("governorates")
  @Public()
  getAllGovernorates() {
    return this.locationService.getAllGovernorates();
  }

  @Get("cities")
  @Public()
  getAllCities() {
    return this.locationService.getAllCities();
  }

  @Get("governorates/:id/cities")
  @Public()
  @ApiParam({
    name: "id",
    description: "governorate id",
    type: "number",
    required: true,
  })
  getAllGovernorateCities(@Param("id") id: string) {
    const idNo = Number(id);
    return this.locationService.getCitiesByGovernorateId(idNo);
  }
}
