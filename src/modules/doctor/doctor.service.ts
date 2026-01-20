/* eslint-disable */

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddDoctorDto,
  ClincAndWorkingDaysDto,
  doctorProfileResetPasswordDoDto,
  doctorProfileResetPasswordDto,
  DoctorProfileViewerDto,
  doctorProfleVerifeAccountEmailDto,
  DoctorUpdateRawDataDto,
  GetDoctorQueriesDto,
  LoginDoctorDto,
  updatePasswordDto,
} from '../../shared/dtos/doctor.dto';
import { DoctorEntity, FileClass } from '../../shared/entities/doctors.entity';

import { PlanService } from '../plan/plan.service';
import { CodeUtilService } from '../../common/utils/code.util';
import { OtpUtilService } from '../../common/utils/otp.util';
import { DoctorResponseType } from '../../shared/type/doctor.type';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Express } from 'express';
import DoctorVerifyUpdateEmail from '../../common/pages/doctor.verifyUpdateEmail';

import { CategoryService } from '../category/category.service';
import { MailService } from '../../mail/mail.service';
import { DoctorProvider } from './doctor.provider';
import { StorageUtilService } from '../../common/utils/storage.util';

import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorProvider: DoctorProvider,
    private readonly config: ConfigService,
    private readonly planService: PlanService,
    private readonly codeService: CodeUtilService,
    private readonly otpService: OtpUtilService,
    private readonly jwtService: JwtUtilService,
    private readonly categoryService: CategoryService,
    private readonly mailService: MailService,
    private readonly StorageUtilService: StorageUtilService,
  ) {}

  async signup(data: AddDoctorDto): Promise<DoctorResponseType & { token: string }> {
    const { email, phone } = data;

    const existingDoctor = await this.doctorProvider.findByEmailOrPhone(email, phone);
    if (existingDoctor) throw new ConflictException('Email or phone already in use');

    const category = await this.categoryService.findOneCategoryForDoctor(data.categoryId);
    if (!category) throw new NotFoundException('Category not found!!');

    const doctor = this.doctorProvider.create(data);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    doctor.password = hashedPassword;
    doctor.category = category;

    const basicPlan = await this.planService.getTheBasicPlan();
    if (!basicPlan) throw new ConflictException('Basic plan not found');

    let code = this.codeService.makeAfliateCode({
      id: doctor.id,
      fullName: doctor.fullName,
    });
    doctor.code = { code, count: 0 };
    doctor.code = { code, count: 0 };
    doctor.plan = basicPlan;

    let otp = this.otpService.generateComplexOtp(6);
    doctor.otp = otp;

    const savedDoctor = await this.doctorProvider.save(doctor);
    if (!savedDoctor) throw new ConflictException('Failed to save doctor');

    try {
      await this.mailService.sendDoctorSignupEmail(
        savedDoctor.fullName.fname + ' ' + savedDoctor.fullName.lname,
        savedDoctor.email,
        otp,
        `${this.config.get<string>('FE_URL')}/doctor/verify-signup`,
      );
    } catch (error) {
      console.error('Error sending doctor signup email:', error);
    }

    const token = this.jwtService.generateToken({
      fullName: savedDoctor.fullName.fname + ' ' + savedDoctor.fullName.lname,
      id: savedDoctor.id,
      isActive: savedDoctor.isActive,
      isVerified: savedDoctor.isVerified,
      email: savedDoctor.email,
    });

    return {
      fullName: savedDoctor.fullName.fname + ' ' + savedDoctor.fullName.lname,
      isActive: savedDoctor.isActive,
      isVerified: savedDoctor.isVerified,
      token,
    };
  }

  async verifyAccountEmail(data: doctorProfleVerifeAccountEmailDto) {
    const { email, otp } = data;
    const doctor = await this.doctorProvider.findByEmail(email);
    if (!doctor) throw new NotFoundException('Doctor account not found!!');
    if (!doctor.otp || doctor.otp != otp)
      throw new ConflictException('Something went wrong with otp!!');
    doctor.isVerified = true;
    doctor.otp = '';
    try {
      await this.doctorProvider.save(doctor);
      return {
        fullName: doctor.fullName.fname + ' ' + doctor.fullName.lname,
        isActive: doctor.isActive,
        isVerified: doctor.isVerified,
      };
    } catch (error) {
      throw new ConflictException('Somthing went wrong on valid your account');
    }
  }

  async login(data: LoginDoctorDto) {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor) throw new NotFoundException('Account not found!');

    const isPasswordValid = await bcrypt.compare(data.password, doctor.password);

    if (!isPasswordValid) throw new ConflictException('Invalid password!');

    if (!doctor.isActive) throw new ConflictException('Account is not active!');
    if (!doctor.isVerified) throw new ConflictException('Account is not verified!');

    const token = await this.jwtService.generateToken({
      email: data.email,
      id: doctor.id,
    });

    const doctorData = {
      name: doctor.fullName,
      email: doctor.email,
      img: doctor.img,
    };

    return { token, doctor: doctorData };
  }

  async updateProfile(data: DoctorUpdateRawDataDto, doctorId: number): Promise<DoctorResponseType> {
    const { email, phone, fullName, address, clinic, categoryId } = data;

    const doctor = await this.doctorProvider.findById(doctorId);
    if (!doctor) throw new NotFoundException('Doctor not found!');

    const existingImgs = doctor.clinic?.imgs || [];
    const updates: Partial<typeof doctor> = {};

    if (email && email !== doctor.email) {
      updates.email = email;
      updates.isVerified = false;
      updates.otp = this.otpService.generateComplexOtp(6);
    }

    if (phone && phone !== doctor.phone) {
      updates.phone = phone;
    }

    if (fullName && JSON.stringify(fullName) !== JSON.stringify(doctor.fullName)) {
      updates.fullName = fullName;
    }

    if (address && JSON.stringify(address) !== JSON.stringify(doctor.address)) {
      updates.address = address;
    }

    if (clinic && JSON.stringify(clinic) !== JSON.stringify(doctor.clinic)) {
      updates.clinic = { ...clinic, imgs: existingImgs };
    }

    if (categoryId && categoryId !== doctor.category?.id) {
      const category = await this.categoryService.findOneCategoryForDoctor(categoryId);
      if (!category) throw new NotFoundException('Category not found!!');
      updates.category = category;
    }

    if (Object.keys(updates).length === 0) {
      return {
        fullName: `${doctor.fullName.fname} ${doctor.fullName.lname}`,
        isActive: doctor.isActive,
        isVerified: doctor.isVerified,
      };
    }

    Object.assign(doctor, updates);

    const updatedDoctor = await this.doctorProvider.save(doctor);
    if (!updatedDoctor) throw new ConflictException('Failed to update account data');

    try {
      await this.mailService.sendUpdateDoctorEmail(
        updatedDoctor.fullName.fname + ' ' + updatedDoctor.fullName.lname,
        updatedDoctor.email,
        updatedDoctor.otp,
        `${
          this.config.get<string>('envConfig.be.updateMyEmailRedirectionLink') +
          '/verify_update_email' +
          `?token=${this.jwtService.generateToken({ email: updatedDoctor.email, id: updatedDoctor.id })}`
        }`,
      );
    } catch (error) {
      console.error('Error sending doctor update email:', error);
    }

    return {
      fullName: `${updatedDoctor.fullName.fname} ${updatedDoctor.fullName.lname}`,
      isActive: updatedDoctor.isActive,
      isVerified: updatedDoctor.isVerified,
    };
  }

  async verifyUpdatedEmail(data: { email: string; id: number }, res: Response) {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor) {
      return res.status(404).send('Doctor not found');
    }
    res.send(DoctorVerifyUpdateEmail(doctor.fullName.fname + ' ' + doctor.fullName.lname));
  }

  async verifyDoctorEmailAfterUpdateOtp(data: {
    otp: string;
    email: string;
    id: number;
  }): Promise<DoctorResponseType> {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor || doctor.id !== data.id) throw new NotFoundException('Doctor not found');
    if (doctor.otp !== data.otp) throw new ConflictException('Invalid OTP');

    doctor.isVerified = true;
    doctor.otp = '';
    const updatedDoctor = await this.doctorProvider.save(doctor);
    if (!updatedDoctor) {
      throw new ConflictException('Failed to update doctor email verification status');
    }
    return {
      fullName: `${updatedDoctor.fullName.fname} ${updatedDoctor.fullName.lname}`,
      isActive: updatedDoctor.isActive,
      isVerified: updatedDoctor.isVerified,
    };
  }

  async requestPasswordReset(data: doctorProfileResetPasswordDto) {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (!doctor.isActive) throw new ConflictException('Doctor account is not active');
    if (!doctor.isVerified) throw new ConflictException('Doctor account is not verified');

    doctor.otp = this.otpService.generateComplexOtp(6);
    const updatedDoctor = await this.doctorProvider.save(doctor);
    if (!updatedDoctor)
      throw new ConflictException('Something went wrong while updating doctor data');

    this.mailService.sendDoctorResetPasswordEmail(
      updatedDoctor.fullName.fname + ' ' + updatedDoctor.fullName.lname,
      updatedDoctor.email,
      updatedDoctor.otp,
      `${this.config.get<string>('envConfig.be.updateMyEmailRedirectionLink') + '/verify_update_email' + `?token=${this.jwtService.generateToken({ email: updatedDoctor.email, id: updatedDoctor.id })}`}`,
    );
    return {
      fullName: `${updatedDoctor.fullName.fname} ${updatedDoctor.fullName.lname}`,
      isActive: updatedDoctor.isActive,
      isVerified: updatedDoctor.isVerified,
    };
  }

  async resetPassword(data: doctorProfileResetPasswordDoDto) {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor) throw new NotFoundException('Doctor account not found!');
    if (!doctor.isActive) throw new ConflictException('Doctor account is not active');
    if (!doctor.isVerified) throw new ConflictException('Doctor account is not verified');
    if (data.otp !== doctor.otp) throw new ConflictException('Invalid OTP!');

    doctor.password = await bcrypt.hash(data.password, 10);
    doctor.otp = '';

    await this.doctorProvider.save(doctor);

    return {
      message: 'Password reset successfully',
      fullName: `${doctor.fullName.fname} ${doctor.fullName.lname}`,
      isActive: doctor.isActive,
      isVerified: doctor.isVerified,
    };
  }

  async updatePassword(data: updatePasswordDto, id: number): Promise<DoctorEntity> {
    const doctor = await this.doctorProvider.findById(id);
    if (!doctor) throw new NotFoundException('Doctor account not found!!');

    const { oldPassword, password } = data;

    const isPassValid = await bcrypt.compare(oldPassword, doctor.password);

    if (!isPassValid) throw new ConflictException('Old password not match!!');

    const hashedNewPassword = await bcrypt.hash(password, 10);
    doctor.password = hashedNewPassword;

    try {
      const savedDoctor = await this.doctorProvider.save(doctor);
      return savedDoctor;
    } catch (error) {
      throw new ConflictException("Failed to update doctor's password");
    }
  }

  async viewProfile(viewedDoctorId: number, data: DoctorProfileViewerDto) {
    const doctor = await this.doctorProvider.findById(viewedDoctorId);
    if (!doctor) throw new ConflictException('Account not found!!');

    const viewerDoctor = data.viewerId ? await this.doctorProvider.findById(data.viewerId) : null;

    const readyViewerData = {
      ip: data.viewerIp.toString(),
      viewer: viewerDoctor ?? null,
      date: new Date(),
    };

    const isViewerExist = Array.from(doctor.views).some(
      (view) =>
        view.ip.toString() === readyViewerData.ip.toString() ||
        (readyViewerData.viewer && view.viewer?.id === readyViewerData.viewer.id),
    );

    if (!isViewerExist) {
      doctor.views = [...(doctor.views || []), readyViewerData];
      await this.doctorProvider.save(doctor);
    }
  }

  async getMyData(id: number): Promise<DoctorEntity> {
    const doctor = await this.doctorProvider.findById(id);
    if (!doctor) throw new ConflictException('Something went wrong, Account not found!!');
    return doctor;
  }

  async updateClinicAndWorkingHours(
    data: ClincAndWorkingDaysDto,
    doctorId: number,
    files?: Array<Express.Multer.File>,
  ) {
    const doctor = await this.doctorProvider.findById(doctorId);
    if (!doctor) throw new NotFoundException('Cannot found doctor account.');

    let uploadedImgs: FileClass[] = [];
    if (files && files.length > 0) {
      const uploadResults = await this.StorageUtilService.uploadFiles(files, 'doctors/clinic');
      uploadedImgs = uploadResults.map((res) => ({
        public_id: res.public_id,
        url: res.url,
      }));
    }

    const { clinic, workingHours } = data;

    await this.doctorProvider.executeTransaction(async (manager) => {
      const existingImgs = doctor.clinic?.imgs || [];
      const newImgs = [...existingImgs, ...uploadedImgs];

      doctor.clinic = {
        name: clinic.name || doctor.clinic.name,
        description: clinic.description || doctor.clinic.description,
        address: clinic.address || doctor.clinic.address,
        phone: clinic.phone || doctor.clinic.phone,
        whats: clinic.whats || doctor.clinic.whats,
        landingPhone: clinic.landingPhone || doctor.clinic.landingPhone,
        price: clinic.price || doctor.clinic.price,
        rePrice: clinic.rePrice || doctor.clinic.rePrice,
        imgs: newImgs,
      };

      const savedDoctor = await manager.save(doctor);

      await this.doctorProvider.deleteWorkingHours(manager, savedDoctor);

      const workingHoursEntities = workingHours.days.map((day) => ({
        day,
        time: {
          from: workingHours.time.from,
          to: workingHours.time.to,
        },
      }));

      const addWorkingHours = await this.doctorProvider.createWorkingHours(
        manager,
        workingHoursEntities,
        savedDoctor,
      );

      if (!addWorkingHours || addWorkingHours.length === 0) {
        throw new ConflictException('Failed to add Clinic Working hours.');
      }
    });

    return {
      message: 'Clinic and working hours updated successfully',
      data: doctor.clinic,
      statusCode: HttpStatus.OK,
    };
  }

  async findAll(queryObj: GetDoctorQueriesDto) {
    return await this.doctorProvider.getAllDoctors(queryObj);
  }

  async toggleBlockStatus(idNo: number) {
    if (!idNo) throw new BadRequestException('Doctor id not found.');

    const doctor = await this.doctorProvider.findById(idNo);
    if (!doctor) throw new ConflictException('Doctor not found.');

    doctor.isActive = !doctor.isActive;
    await this.doctorProvider.save(doctor);

    return {
      isActive: Boolean(doctor.isActive),
    };
  }

  public async uploadPaymentImage(file: Express.Multer.File, doctorId: number) {
    if (!file) throw new BadRequestException('No file provided');
    if (!doctorId) throw new BadRequestException('Doctor id not provided');

    const doctor = await this.doctorProvider.findById(doctorId);

    const uploadResult = await this.StorageUtilService.uploadFile(file, 'doctors/payment');
    if (!uploadResult || !uploadResult.url) {
      throw new ConflictException('Could not upload image');
    }

    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.paymentImage = uploadResult.url;
    await this.doctorProvider.save(doctor);

    return { success: true, url: uploadResult.url, doctorId };
  }

  async remove(idNo: number) {
    if (!idNo) throw new BadRequestException('Doctor id not found.');

    const doctor = await this.doctorProvider.findById(idNo);
    if (!doctor) throw new ConflictException('Doctor not found.');

    await this.doctorProvider.deleteDoctor(doctor.id);

    return {
      message: 'Doctor deleted successfully',
    };
  }

  public async getFiltrationInfo() {
    return this.doctorProvider.getDoctorFiltrationInfo();
  }

  public async getBestDoctors() {
    const doctors = await this.doctorProvider.getBestDoctors();
    return doctors.map((doctor) => ({
      ...doctor,
      viewCount: doctor.views ? doctor.views.length : 0,
    }));
  }
}
