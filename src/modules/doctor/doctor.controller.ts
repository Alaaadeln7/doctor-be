/* eslint-disable */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AddDoctorDto,
  ClincAndWorkingDaysDto,
  ClincForWorkingHourDto,
  doctorProfileResetPasswordDoDto,
  doctorProfileResetPasswordDto,
  DoctorProfileViewerDto,
  doctorProfleVerifeAccountEmailDto,
  DoctorUpdateRawDataDto,
  GetDoctorQueriesDto,
  LoginDoctorDto,
  orderKeyEnums,
  updatePasswordDto,
  WorkingHoursInputDto,
} from '../../shared/dtos/doctor.dto';
import { DoctorService } from './doctor.service';
import { Public } from '../../common/decorators/public.decorator';
import { DoctorResponseType } from '../../shared/type/doctor.type';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import type { Request } from 'express';
import { DoctorEntity, FileClass } from '../../shared/entities/doctors.entity';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/auth.guard';
import { Express } from 'express';
@Controller('/doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly jwtService: JwtUtilService,
  ) {}

  @Post('upload-payment-image')
  @ApiOperation({ summary: 'Upload payment image for doctor' })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('paymentImage'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadPaymentImage(@Req() req: Request, @UploadedFile() paymentImage: Express.Multer.File) {
    if (!paymentImage) {
      throw new BadRequestException('Payment image file is required');
    }
    const { id } = req['user'];
    return this.doctorService.uploadPaymentImage(paymentImage, +id);
  }

  @Post('/signup')
  @Public()
  @ApiOperation({ summary: 'Doctor signup' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  async signup(@Body() data: AddDoctorDto) {
    return this.doctorService.signup(data);
  }

  @Post('/verify-signup')
  @Public()
  @ApiOperation({ summary: 'Verify doctor signup with OTP' })
  async verifyEmail(@Body() data: doctorProfleVerifeAccountEmailDto) {
    return this.doctorService.verifyAccountEmail(data);
  }

  @Post('/login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Doctor login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() data: LoginDoctorDto) {
    return this.doctorService.login(data);
  }

  @Post('/clinic-and-working-hours')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update clinic and working hours' })
  @UseInterceptors(FilesInterceptor('imgs'))
  @ApiConsumes('multipart/form-data')
  @ApiExtraModels(ClincForWorkingHourDto, WorkingHoursInputDto)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clinic: {
          $ref: getSchemaPath(ClincForWorkingHourDto),
        },
        workingHours: {
          $ref: getSchemaPath(WorkingHoursInputDto),
        },
        imgs: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async updateClinicAndWorkingHours(
    @Body() data: ClincAndWorkingDaysDto,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const { id } = req['user'];
    return this.doctorService.updateClinicAndWorkingHours(data, id, files);
  }

  @Put('/update-my-profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update doctor profile raw data' })
  async updateProfile(@Body() data: DoctorUpdateRawDataDto, @Req() req: Request) {
    const { id } = req['user'];
    return this.doctorService.updateProfile(data, id);
  }

  @Get('/verify-update-email')
  @Public()
  @ApiOperation({ summary: 'Verify updated email via token' })
  async verifyUpdatedEmail(@Query('token') token: string) {
    const decoded = this.jwtService.verifyToken(token);
    if (!decoded || !decoded.email || !decoded.id) {
      throw new BadRequestException('Invalid credentials!!!');
    }
    return this.doctorService.verifyUpdatedEmail({ email: decoded.email, id: +decoded.id });
  }

  @Public()
  @Post('/verify-doctor-email-after-update-otp')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Verify doctor email after update with OTP' })
  async verifyDoctorEmailAfterUpdateOtp(@Body('otp') otp: string, @Query('token') token: string) {
    const decoded = this.jwtService.verifyToken(token);
    if (!decoded || !decoded.email || !decoded.id) {
      throw new BadRequestException('Invalid credentials!!!');
    }
    return this.doctorService.verifyDoctorEmailAfterUpdateOtp({
      otp,
      email: decoded.email,
      id: +decoded.id,
    });
  }

  @Public()
  @Post('/reset-password-request')
  @ApiOperation({ summary: 'Request password reset' })
  async requestPasswordReset(@Body() data: doctorProfileResetPasswordDto) {
    return this.doctorService.requestPasswordReset(data);
  }

  @Public()
  @Post('/reset-password')
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() data: doctorProfileResetPasswordDoDto) {
    return this.doctorService.resetPassword(data);
  }

  @Patch('/update-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update doctor password' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    type: DoctorEntity,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 409, description: 'Old password incorrectly' })
  async updatePassword(@Body() data: updatePasswordDto, @Req() req: Request) {
    const { id } = req['user'];
    return this.doctorService.updatePassword(data, +id);
  }

  @Patch('/:id/view')
  @Public()
  @HttpCode(204)
  @ApiOperation({ summary: 'Record profile view' })
  @ApiParam({
    name: 'id',
    description: 'profile id',
    required: true,
    example: 1,
    type: 'number',
  })
  async viewProfile(@Param('id') id: string, @Body() data: DoctorProfileViewerDto) {
    return this.doctorService.viewProfile(+id, data);
  }

  @Get('/my-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current doctor data' })
  async getMyData(@Req() req: Request): Promise<DoctorEntity> {
    const { id } = req['user'];
    return this.doctorService.getMyData(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors with filtration' })
  @ApiQuery({
    name: 'page',
    description: 'pagination',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'pagination',
    required: false,
    example: 10,
  })
  @ApiQuery({ name: 'orderKey', required: false, enum: orderKeyEnums })
  @ApiQuery({ name: 'orderValue', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'best', required: false, type: String })
  @ApiQuery({ name: 'governorate', required: false, type: String })
  @ApiQuery({ name: 'center', required: false, type: String })
  @Public()
  async getAllDoctors(@Query() queries: GetDoctorQueriesDto) {
    const { orderKey, orderValue, search, best, price, governorate, center, page, limit } = queries;

    const directDoctorFilters: any = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };

    if (orderKey) directDoctorFilters.orderKey = orderKey;
    if (orderValue) directDoctorFilters.orderValue = orderValue;
    if (search) directDoctorFilters.search = search;
    if (price) directDoctorFilters.price = price;
    if (best) directDoctorFilters.best = best;
    if (governorate) directDoctorFilters.governorate = governorate;
    if (center) directDoctorFilters.center = center;

    return this.doctorService.findAll(directDoctorFilters);
  }

  @Patch('/handle-block/:id')
  @ApiOperation({ summary: 'Toggle doctor block status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth('access-token')
  async toggleBlockStatus(@Param('id') id: string) {
    return this.doctorService.toggleBlockStatus(+id);
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Delete doctor account' })
  @ApiResponse({
    status: 200,
    description: 'Doctor deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Doctor deleted successfully' },
      },
    },
  })
  @ApiBearerAuth('access-token')
  async remove(@Param('id') id: string) {
    return this.doctorService.remove(+id);
  }

  @Get('/best')
  @Public()
  @ApiOperation({
    summary: 'Get the best 4 doctors based on reviews (rating) and views',
    description: 'Returns top 4 doctors sorted by rating and view count',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the best 4 doctors',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          email: { type: 'string', example: 'doctor@example.com' },
          phone: { type: 'string', example: '01012345678' },
          fullName: {
            type: 'object',
            properties: {
              fname: { type: 'string', example: 'John' },
              lname: { type: 'string', example: 'Doe' },
            },
          },
          rating: { type: 'number', example: 4.5 },
          viewCount: { type: 'number', example: 150 },
          img: { type: 'string', example: 'https://example.com/image.png' },
          clinic: { type: 'object' },
          category: { type: 'object' },
        },
      },
    },
  })
  async getBestDoctors() {
    return this.doctorService.getBestDoctors();
  }

  @Get('/filters-info')
  @UseGuards(AuthGuard)
  @Public()
  @ApiOperation({
    summary: 'Get doctor filtration info like min price, max price and payment ways',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        minPrice: { type: 'number', example: 100 },
        maxPrice: { type: 'number', example: 500 },
        paymentWays: {
          type: 'array',
          items: { type: 'string', example: 'cash' },
        },
      },
    },
  })
  async getDoctorFiltrationInfo() {
    return this.doctorService.getFiltrationInfo();
  }
}
