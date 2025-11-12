/* eslint-disable */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { paginate, Pagination } from "nestjs-typeorm-paginate";
import { Repository } from "typeorm";

import { BcryptUtilService } from "../../common/utils/bcrypt.util";
import { JwtUtilService } from "../../common/utils/jwt.utils";
import { OtpUtilService } from "../../common/utils/otp.util";
import { MailService } from "src/mail/mail.service";
import { AdminEntity } from "../../shared/entities/admins.entity";
import {
  BlockAdminDtoResponse,
  CreateAdminDto,
  getAllAdminsQueryDto,
  LoginAdminDto,
  LoginAdminRequestDto,
  LoginRequestResponseDto,
  ResetPasswordDto,
  ResetPasswordRequestDto,
  SignupResponseDto,
  updateMyAdminDataDto,
  UpdateMyAdminDataResponseDto,
  UpdatePagesDto,
  updatePagesResponseDto,
  VerifyAdminDtoResponse,
  VerifyAdminSignupDto,
} from "../../shared/dtos/admin.dto";

/**
 * Service for managing admin operations including authentication, profile management, and admin CRUD
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    private readonly bcryptService: BcryptUtilService,
    private readonly jwtService: JwtUtilService,
    private readonly otpService: OtpUtilService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  /**
   * Creates a new admin account
   * @param data - Admin creation data
   * @returns Created admin details without sensitive information
   * @throws ConflictException if admin creation fails
   */
  async createAdmin(data: CreateAdminDto): Promise<SignupResponseDto> {
    const { name, password, email } = data;

    const hashedPassword = await this.bcryptService.bcryptHashingUtil(password);
    const newAdmin = this.adminRepo.create({
      name,
      password: hashedPassword,
      email,
    });

    if (!newAdmin) {
      throw new ConflictException("Failed to create admin account");
    }

    const otp = this.otpService.generateComplexOtp(6);
    newAdmin.otp = otp;

    // TODO: Uncomment when mail service is ready
    // await this.mailService.sendMail({
    //   to: email,
    //   subject: "DRS Automated Email - Please follow the steps below",
    //   template: "admin_signup",
    //   context: { name, otp, otpLink: "https://www.google.com" },
    // });

    const savedAdmin = await this.adminRepo.save(newAdmin);

    return {
      name: savedAdmin.name,
      role: savedAdmin.role,
    };
  }

  /**
   * Verifies admin signup using OTP
   * @param data - Verification data containing email and OTP
   * @returns Verified admin details
   * @throws NotFoundException if admin not found
   * @throws ConflictException if OTP is invalid
   */
  async verifyAdminSignup(
    data: VerifyAdminSignupDto
  ): Promise<SignupResponseDto> {
    const { email, otp } = data;

    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    if (admin.otp !== otp) {
      throw new ConflictException("Invalid OTP");
    }

    admin.isActive = true;
    admin.otp = "";

    const savedAdmin = await this.adminRepo.save(admin);

    return {
      name: savedAdmin.name,
      role: savedAdmin.role,
    };
  }

  /**
   * Initiates admin login process by sending OTP
   * @param data - Login request data containing email
   * @returns Admin details for login response
   * @throws NotFoundException if admin not found
   */
  async loginAdminRequest(
    data: LoginAdminRequestDto
  ): Promise<LoginRequestResponseDto> {
    const { email } = data;

    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    const otp = this.otpService.generateComplexOtp(6);
    admin.otp = otp;

    // TODO: Uncomment when mail service is ready
    // await this.mailService.sendMail({
    //   to: email,
    //   subject: "DRS Automated Email - Please follow the steps below",
    //   template: "admin_login",
    //   context: {
    //     name: admin.name,
    //     otp,
    //     otpLink: "https://www.google.com",
    //   },
    // });

    await this.adminRepo.save(admin);

    return {
      name: admin.name,
      role: admin.role,
    };
  }

  /**
   * Completes admin login with OTP and password verification
   * @param data - Login credentials
   * @returns JWT token for authenticated session
   * @throws NotFoundException if admin not found
   * @throws ConflictException if OTP or password is invalid
   */
  async loginAdmin(data: LoginAdminDto): Promise<{ token: string }> {
    const { email, password, otp } = data;

    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    if (admin.otp !== otp) {
      throw new ConflictException("Invalid OTP");
    }

    const isPasswordValid = await this.bcryptService.bcryptCompareUtil(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      throw new ConflictException("Invalid password");
    }

    const token = this.jwtService.generateToken({
      name: admin.name,
      id: admin.id,
      role: admin.role,
      isActive: admin.isActive,
      email,
      pages: admin.pages,
    });

    try {
      await this.mailService.sendLoginEmail(admin.name, admin.email);
    } catch (error) {
      console.error("Failed to send login email:", error);
    }

    admin.otp = "";
    await this.adminRepo.save(admin);

    return { token };
  }

  /**
   * Initiates password reset process by sending OTP
   * @param data - Reset password request data
   * @returns Empty object on success
   * @throws NotFoundException if admin not found
   */
  async resetPasswordRequest(data: ResetPasswordRequestDto): Promise<object> {
    const admin = await this.adminRepo.findOne({
      where: { email: data.email },
    });

    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    const otp = this.otpService.generateComplexOtp(6);
    admin.otp = otp;

    // TODO: Uncomment when mail service is ready
    // await this.mailService.sendMail({
    //   to: data.email,
    //   subject: "DRS Automated Email - Please follow the steps below",
    //   template: "admin_reset_password_request",
    //   context: {
    //     name: admin.name,
    //     otp,
    //     otpLink: "https://www.google.com",
    //   },
    // });

    await this.adminRepo.save(admin);

    return {};
  }

  /**
   * Completes password reset with OTP verification
   * @param data - Reset password data
   * @returns Empty object on success
   * @throws NotFoundException if admin not found
   * @throws ConflictException if OTP is invalid
   */
  async resetPassword(data: ResetPasswordDto): Promise<object> {
    const admin = await this.adminRepo.findOne({
      where: { email: data.email },
    });

    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    if (admin.otp !== data.otp) {
      throw new ConflictException("Invalid OTP");
    }

    const hashedPassword = await this.bcryptService.bcryptHashingUtil(
      data.password
    );

    admin.password = hashedPassword;
    admin.otp = "";

    await this.adminRepo.save(admin);

    return {};
  }

  /**
   * Updates current admin's profile data
   * @param data - Update data
   * @param id - Admin ID
   * @returns Updated admin details
   * @throws ConflictException if admin not found
   */
  async updateMyAdminData(
    data: updateMyAdminDataDto,
    id: number
  ): Promise<UpdateMyAdminDataResponseDto> {
    const { name, email, password } = data;

    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new ConflictException("Admin not found");
    }

    if (name && name !== admin.name) {
      admin.name = name;
    }

    if (email && email !== admin.email) {
      admin.email = email;
      const otp = this.otpService.generateComplexOtp(6);
      admin.otp = otp;

      const hashedOtp = await this.bcryptService.bcryptHashingUtil(otp);
      const token = this.jwtService.generateToken(
        { otp: hashedOtp, email },
        "1h"
      );

      // TODO: Uncomment when mail service is ready
      // await this.mailService.sendMail({
      //   to: email,
      //   subject: "DRS Automated Email - Please follow the steps below",
      //   template: "update_my_admin_data",
      //   context: {
      //     name: admin.name,
      //     redirectLink: this.configService.get<string>(
      //       "envConfig.links.updateMyEmailRedirectionLink"
      //     ) + token,
      //   },
      // });

      admin.isVerified = false;
    }

    if (password) {
      const isSamePassword = await this.bcryptService.bcryptCompareUtil(
        password,
        admin.password
      );

      if (!isSamePassword) {
        admin.password = await this.bcryptService.bcryptHashingUtil(password);
      }
    }

    const savedAdmin = await this.adminRepo.save(admin);

    return {
      name: savedAdmin.name,
      role: savedAdmin.role,
    };
  }

  /**
   * Verifies admin account after email update
   * @param data - Verification data containing OTP and email
   * @returns Updated admin details
   * @throws NotFoundException if admin not found
   * @throws ConflictException if OTP is invalid
   */
  async verifyAccountIfUpdated(data: {
    otp: string;
    email: string;
  }): Promise<UpdateMyAdminDataResponseDto> {
    const { otp, email } = data;

    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    const isOtpCorrect = await this.bcryptService.bcryptCompareUtil(
      admin.otp,
      otp
    );

    if (!isOtpCorrect) {
      throw new ConflictException("Invalid OTP");
    }

    admin.isVerified = true;
    admin.otp = "";

    await this.adminRepo.save(admin);

    return {
      name: admin.name,
      role: admin.role,
    };
  }

  /**
   * Retrieves current admin's data
   * @param id - Admin ID
   * @returns Admin entity without sensitive fields
   * @throws NotFoundException if admin not found
   */
  async getMyAdminData(id: number): Promise<AdminEntity> {
    const admin = await this.adminRepo.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        isActive: true,
        role: true,
        pages: true,
      },
    });

    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    return admin;
  }

  /**
   * Toggles admin active status (block/unblock)
   * @param id - Admin ID
   * @returns Updated admin status
   * @throws NotFoundException if admin not found
   */
  async blockAdmin(id: number): Promise<BlockAdminDtoResponse> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    admin.isActive = !admin.isActive;
    await this.adminRepo.save(admin);

    return {
      isActive: admin.isActive,
      name: admin.name,
      role: admin.role,
    };
  }

  /**
   * Toggles admin verification status
   * @param id - Admin ID
   * @returns Updated verification status
   * @throws NotFoundException if admin not found
   */
  async verifyAdmin(id: number): Promise<VerifyAdminDtoResponse> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    admin.isVerified = !admin.isVerified;
    await this.adminRepo.save(admin);

    return {
      isVerified: admin.isVerified,
      name: admin.name,
      role: admin.role,
    };
  }

  /**
   * Updates admin page permissions
   * @param data - Page update data
   * @param id - Admin ID
   * @returns Updated page permissions
   * @throws NotFoundException if admin not found
   */
  async updatePages(
    data: UpdatePagesDto,
    id: number
  ): Promise<updatePagesResponseDto> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    admin.pages = data.pages;
    await this.adminRepo.save(admin);

    return {
      pages: data.pages,
      name: admin.name,
      role: admin.role,
    };
  }

  /**
   * Retrieves specific admin details
   * @param id - Admin ID
   * @returns Admin entity without sensitive fields
   * @throws NotFoundException if admin not found
   */
  async getOneAdmin(id: number): Promise<AdminEntity> {
    const admin = await this.adminRepo.findOne({
      where: { id },
      select: {
        name: true,
        email: true,
        pages: true,
        isActive: true,
        isVerified: true,
        role: true,
      },
    });

    if (!admin) {
      throw new NotFoundException("Admin not found");
    }

    return admin;
  }

  /**
   * Retrieves paginated list of admins with filtering and sorting
   * @param queries - Query parameters for pagination and filtering
   * @returns Paginated list of admins
   */
  async getAllAdmins(
    queries: getAllAdminsQueryDto
  ): Promise<Pagination<AdminEntity>> {
    const adminsQuery = this.adminRepo.createQueryBuilder("admin");

    adminsQuery
      .select([
        "admin.id",
        "admin.name",
        "admin.email",
        "admin.isActive",
        "admin.isVerified",
      ])
      .orderBy("admin.id", queries.sorting ?? "ASC");

    if (queries?.isActive !== undefined) {
      adminsQuery.andWhere("admin.isActive = :isActive", {
        isActive: queries.isActive,
      });
    }

    if (queries?.isVerified !== undefined) {
      adminsQuery.andWhere("admin.isVerified = :isVerified", {
        isVerified: queries.isVerified,
      });
    }

    if (queries?.search) {
      adminsQuery.andWhere(
        "(admin.name LIKE :search OR admin.email LIKE :search)",
        { search: `%${queries.search}%` }
      );
    }

    return paginate<AdminEntity>(adminsQuery, {
      page: queries.page ?? 1,
      limit: queries.limit ?? 10,
      route: "/admin/all",
    });
  }
}
