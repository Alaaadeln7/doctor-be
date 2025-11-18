/* eslint-disable */

import { Injectable } from "@nestjs/common";

import governoratesData from "../../shared/data/governorates.json";
import citiesData from "../../shared/data/cities.json";
@Injectable()
export class LocationService {
  private governorates = governoratesData || [];

  private cities = citiesData || [];

  getAllGovernorates() {
    return this.governorates;
  }

  getAllCities() {
    return this.cities;
  }

  getCitiesByGovernorateId(governorateId: number) {
    return this.cities.filter(
      (city) => Number(city.governorate_id) === governorateId
    );
  }
}
