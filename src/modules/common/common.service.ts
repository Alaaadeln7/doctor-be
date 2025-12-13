/* eslint-disable */

import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpUtilService } from '../..//common/utils/otp.util';
import {
  ContactUsDto,
  ResendOtpCodeDto,
  ResendOtpResponseDto,
} from '../..//shared/dtos/common.dto';
import { AdminEntity } from '../../shared/entities/admins.entity';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { LocationService } from '../location/location.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class CommonService {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly locationService: LocationService,
    @InjectRepository(DoctorEntity)
    private readonly doctorRepo: Repository<DoctorEntity>,
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    private readonly otpService: OtpUtilService,
    private readonly mailService: MailService,
  ) {}
  async resendOtpCode(data: ResendOtpCodeDto): Promise<ResendOtpResponseDto> {
    if (!data.email || !data.phone)
      throw new BadRequestException('email or phone required, at least one!!');
    const model = data.model == 'admin' ? this.adminRepo : this.doctorRepo;
    const findUser = await model.findOne({
      where: [{ email: data.email }, { phone: data.phone }],
    });
    if (!findUser) throw new ConflictException('Account not found!!');
    const otp = this.otpService.generateComplexOtp(6);
    findUser.otp = otp;
    const name =
      data.model == 'admin'
        ? (findUser as AdminEntity).name
        : (findUser as DoctorEntity).fullName.fname +
          ' ' +
          (findUser as DoctorEntity).fullName.lname;
    const isEmail = data.email ? true : false;
    if (isEmail) {
      try {
        await this.mailService.sendResendCodeEmail(name, data.email, otp);
      } catch (error) {
        console.log(error);
        throw new BadRequestException('Something went wrong!!');
      }
    }
    return {
      name,
      email: findUser.email,
    };
  }

  createNewAccountEssentials() {
    const categories = this.categoryService.getAllCategories(1, 50);
    const governorates = this.locationService.getAllGovernorates();

    return {
      categories,
      governorates,
    };
  }

  async contactUs(data: ContactUsDto) {
    try {
      await this.mailService.sendContactUsEmail(data.name, data.email, data.message);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Something went wrong!!');
    }
    return null;
  }

  async getDashboardAnalytics() {
    const doctorsCount = await this.doctorRepo.count();
    const activeDoctorsCount = await this.doctorRepo.count({
      where: {
        isActive: true,
      },
    });
    const inActiveDoctorsCount = doctorsCount - activeDoctorsCount;

    const adminsCount = await this.adminRepo.count();
    const activeAdminsCount = await this.adminRepo.count({
      where: {
        isActive: true,
      },
    });
    const inActiveAdminsCount = adminsCount - activeAdminsCount;

    return {
      doctors: {
        count: doctorsCount,
        activeCount: activeDoctorsCount,
        inActiveCount: inActiveDoctorsCount,
      },
      admins: {
        count: adminsCount,
        activeCount: activeAdminsCount,
        inActiveCount: inActiveAdminsCount,
      },
    };
  }
}
