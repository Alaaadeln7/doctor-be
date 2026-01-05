/* eslint-disable */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddDoctorDto,
  ClincAndWorkingDaysDto,
  doctorProfileChooseCategoryDto,
  doctorProfileResetPasswordDoDto,
  doctorProfileResetPasswordDto,
  DoctorProfileViewerDto,
  doctorProfleVerifeAccountEmailDto,
  DoctorUpdateRawDataDto,
  GetDoctorQueriesDto,
  LoginDoctorDto,
  updatePasswordDto,
} from '../../shared/dtos/doctor.dto';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { CredentialService } from '../credential/credential.service';
import { PlanService } from '../plan/plan.service';
import { CodeUtilService } from '../../common/utils/code.util';
import { OtpUtilService } from '../../common/utils/otp.util';
import { DoctorResponseType } from '../../shared/type/doctor.type';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Express } from 'express';
import DoctorVerifyUpdateEmail from '../../common/pages/doctor.verifyUpdateEmail';
import { BcryptUtilService } from '../../common/utils/bcrypt.util';
import { CategoryService } from '../category/category.service';
import { MailService } from '../../mail/mail.service';
import { DoctorProvider } from './doctor.provider';
import { StorageUtilService } from 'src/common/utils/storage.util';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorProvider: DoctorProvider,
    private readonly credintialService: CredentialService,
    private readonly planService: PlanService,
    private readonly codeService: CodeUtilService,
    private readonly otpService: OtpUtilService,
    private readonly jwtService: JwtUtilService,
    private readonly config: ConfigService,
    private readonly bcryptService: BcryptUtilService,
    private readonly categoryService: CategoryService,
    private readonly mailService: MailService,
    private readonly StorageUtilService: StorageUtilService,
  ) {}

  async doctorSignup(data: AddDoctorDto): Promise<DoctorResponseType & { token: string }> {
    const { email, phone } = data;

    const existingDoctor = await this.doctorProvider.findByEmailOrPhone(email, phone);
    if (existingDoctor) throw new ConflictException('Email or phone already in use');

    const doctor = this.doctorProvider.create(data);

    const credential = await this.credintialService.createDoctorCredits({
      password: await this.bcryptService.bcryptHashingUtil(data.password),
      doctor,
    });

    if (!credential) throw new ConflictException('Failed to create doctor credits');

    const basicPlan = await this.planService.getTheBasicPlan();
    if (!basicPlan) throw new ConflictException('Basic plan not found');

    let code = this.codeService.makeAfliateCode({
      id: doctor.id,
      fullName: doctor.fullName,
    });
    doctor.code = { code, count: 0 };
    doctor.plan = basicPlan;
    doctor.credential = credential;

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

  async doctorProfileVerifyAccountEmail(data: doctorProfleVerifeAccountEmailDto) {
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

  async doctorLogin(data: LoginDoctorDto): Promise<{
    token: string;
    doctor: {
      name: { fname: string; lname: string };
      email: string;
      img: string | any;
    };
  }> {
    const doctor = await this.doctorProvider.findByEmail(data.email);
    if (!doctor) throw new NotFoundException('Account not found!');
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

  async updateMyDoctorProfileRawData(
    data: DoctorUpdateRawDataDto,
    doctorId: number,
  ): Promise<DoctorResponseType> {
    const { email, phone, fullName, address, clinic } = data;

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

  async doctorResetPasswordRequest(data: doctorProfileResetPasswordDto) {
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

  async doctorResetPassword(data: doctorProfileResetPasswordDoDto) {
    const doctor = await this.doctorProvider.findByEmailWithCredentials(data.email);
    if (!doctor) throw new NotFoundException('Doctor account not found!');
    if (!doctor.isActive) throw new ConflictException('Doctor account is not active');
    if (!doctor.isVerified) throw new ConflictException('Doctor account is not verified');
    if (data.otp !== doctor.otp) throw new ConflictException('Invalid OTP!');
    if (!doctor.credential) throw new ConflictException('Doctor credentials not found!');

    doctor.credential.password = await this.bcryptService.bcryptHashingUtil(data.password);
    doctor.otp = '';

    await this.credintialService.saveDoctorCredential(doctor.credential);
    await this.doctorProvider.save(doctor);

    return {
      message: 'Password reset successfully',
      fullName: `${doctor.fullName.fname} ${doctor.fullName.lname}`,
      isActive: doctor.isActive,
      isVerified: doctor.isVerified,
    };
  }

  async doctorProfileChooseCategory(data: doctorProfileChooseCategoryDto, id: number) {
    const category = await this.categoryService.findOneCategoryForDoctor(+data?.categoryId);
    if (!category) throw new NotFoundException('Category not found!!');

    const doctor = await this.doctorProvider.findById(id);
    if (!doctor) throw new NotFoundException('Doctor account not found!!');

    doctor.category = category;

    try {
      const savedDoctor = await this.doctorProvider.save(doctor);
      return savedDoctor;
    } catch (error) {
      throw new ConflictException("Failed to update doctor's category.");
    }
  }

  async doctorProfileUpdatePassword(data: updatePasswordDto, id: number): Promise<DoctorEntity> {
    const doctor = await this.doctorProvider.findByIdWithCredentials(id);
    if (!doctor) throw new NotFoundException('Doctor account not found!!');

    const { oldPassword, password } = data;
    const isPassvalid = await this.bcryptService.bcryptCompareUtil(
      oldPassword,
      doctor.credential.password,
    );
    if (!isPassvalid) throw new ConflictException('Old password not match!!');

    doctor.credential.password = await this.bcryptService.bcryptHashingUtil(password);
    try {
      const savedDoctor = await this.doctorProvider.save(doctor);
      return savedDoctor;
    } catch (error) {
      throw new ConflictException("Failed to update doctor's password");
    }
  }

  async doctorProfileView(viewedDoctorId: number, data: DoctorProfileViewerDto) {
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

  async clincAndWorkingDays(data: ClincAndWorkingDaysDto, doctorId: number) {
    const doctor = await this.doctorProvider.findById(doctorId);
    if (!doctor) throw new NotFoundException('Cannot found doctor account.');

    const { clinic, workingHours } = data;

    return await this.doctorProvider.executeTransaction(async (manager) => {
      doctor.clinic = {
        name: clinic.name || doctor.clinic.name,
        description: clinic.description || doctor.clinic.description,
        address: clinic.address || doctor.clinic.address,
        phone: clinic.phone || doctor.clinic.phone,
        whats: clinic.whats || doctor.clinic.whats,
        landingPhone: clinic.landingPhone || doctor.clinic.landingPhone,
        price: clinic.price || doctor.clinic.price,
        rePrice: clinic.rePrice || doctor.clinic.rePrice,
        imgs: doctor.clinic.imgs,
      };

      const savedDoctor = await manager.save(doctor);

      await this.doctorProvider.deleteWorkingHours(manager, savedDoctor);

      const addWorkingHours = await this.doctorProvider.createWorkingHours(
        manager,
        workingHours,
        savedDoctor,
      );

      if (!addWorkingHours || addWorkingHours.length === 0) {
        throw new ConflictException('Failed to add Clinic Working hours.');
      }

      return {
        doctor: savedDoctor,
        workingHours: addWorkingHours,
      };
    });
  }

  async getAllDoctors(queryObj: GetDoctorQueriesDto) {
    return await this.doctorProvider.getAllDoctors(queryObj);
  }

  async handleBlockDoctor(idNo: number) {
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

  public async deleteDoctor(idNo: number) {
    if (!idNo) throw new BadRequestException('Doctor id not found.');

    const doctor = await this.doctorProvider.findById(idNo);
    if (!doctor) throw new ConflictException('Doctor not found.');

    doctor.isActive = !doctor.isActive;
    await this.doctorProvider.save(doctor);

    return {
      isActive: Boolean(doctor.isActive),
    };
  }

  public async getDoctorFiltrationInfo() {
    return this.doctorProvider.getDoctorFiltrationInfo();
  }
}
