import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminEntity } from "../shared/entities/admins.entity";
import { AppointmentEntity } from "../shared/entities/appointments.entity";
import { CategoryEntity } from "../shared/entities/categoris.entity";
import { CredentialEntity } from "../shared/entities/credentials.entity";
import { DoctorEntity } from "../shared/entities/doctors.entity";
import { PlanEntity } from "../shared/entities/plans.entity";
import { RateEntity } from "../shared/entities/rates.entity";
import { RequestEntity } from "../shared/entities/requests.entity";
import { ReservationEntity } from "../shared/entities/reservations.entity";
import { WorkingHoursEntity } from "../shared/entities/workinHours.entity";
import { GovernorateEntity } from "../shared/entities/governorate.entity";
import { CityEntity } from "../shared/entities/city.entity";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = process.env.NODE_ENV === "dev";
        return {
          type: "postgres",
          host: configService.get<string>("envConfig.db.host"),
          port: configService.get<number>("envConfig.db.port"),
          username: configService.get<string>("envConfig.db.user"),
          password: configService.get<string>("envConfig.db.pass"),
          database: configService.get<string>("envConfig.db.name"),
          entities: [
            AdminEntity,
            PlanEntity,
            DoctorEntity,
            AppointmentEntity,
            CategoryEntity,
            RateEntity,
            RequestEntity,
            ReservationEntity,
            WorkingHoursEntity,
            CredentialEntity,
            GovernorateEntity,
            CityEntity,
          ],
          synchronize: true,
          logging: isDevelopment,
          ssl: !isDevelopment ? { rejectUnauthorized: false } : false,
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DbModule {}
