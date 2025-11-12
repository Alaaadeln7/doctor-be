import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { StorageUtilService } from "../..//common/utils/storage.util";
import { CloudinaryBaseUtilService } from "../..//common/utils/cloudinary.util";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DoctorEntity } from "../..//shared/entities/doctors.entity";
import { FileService } from "./file.service";

@Module({
  imports: [TypeOrmModule.forFeature([DoctorEntity])],
  providers: [StorageUtilService, CloudinaryBaseUtilService, FileService],
  controllers: [FileController],
})
export class FileModule {}
