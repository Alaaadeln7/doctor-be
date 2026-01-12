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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
  orderKeyEnums,
  updatePasswordDto,
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
} from '@nestjs/swagger';
import { JwtUtilService } from '../../common/utils/jwt.utils';
import type { Request, Response } from 'express';
import { DoctorEntity, FileClass } from '../../shared/entities/doctors.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/guards/auth.guard';
import { Express } from 'express';
@Controller('/doctor')
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly jwtService: JwtUtilService,
  ) {}

  @Post('upload-payment-image')
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
  async doctorSignup(@Body() data: AddDoctorDto): Promise<DoctorResponseType & { token: string }> {
    return this.doctorService.doctorSignup(data);
  }

  @Post('/verify-signup')
  @Public()
  async doctorProfileVerifyAccountEmail(@Body() data: doctorProfleVerifeAccountEmailDto) {
    return this.doctorService.doctorProfileVerifyAccountEmail(data);
  }

  @Post('/login')
  @Public()
  @HttpCode(200)
  async doctorLogin(@Body() data: LoginDoctorDto): Promise<{
    token: string;
    doctor: {
      name: { fname: string; lname: string };
      email: string;
      img: string | FileClass;
    };
  }> {
    return this.doctorService.doctorLogin(data);
  }

  @Post('/clinic-and-working-hours')
  @ApiBearerAuth('access-token')
  async addClincAndWorkingHours(@Body() data: ClincAndWorkingDaysDto, @Req() req: Request) {
    const { id } = req['user'];
    return this.doctorService.clincAndWorkingDays(data, id);
  }

  @Put('/update-my-profile')
  @ApiBearerAuth('access-token')
  async updateMyDoctorProfileRawData(
    @Body() data: DoctorUpdateRawDataDto,
    @Req() req: Request,
  ): Promise<DoctorResponseType> {
    const { id } = req['user'];
    return this.doctorService.updateMyDoctorProfileRawData(data, id);
  }

  @Get('/verify-update-email')
  @Public()
  async verifyUpdatedEmail(@Res() res: Response, @Query('token') token: string) {
    const decoded = this.jwtService.verifyToken(token);
    if (!decoded || !decoded.email || !decoded.id) {
      return res.status(400).send('Invalid credentials!!!');
    }
    return this.doctorService.verifyUpdatedEmail({ email: decoded.email, id: +decoded.id }, res);
  }

  @Public()
  @Post('/verify-doctor-email-after-update-otp')
  @ApiExcludeEndpoint()
  async verifyDoctorEmailAfterUpdateOtp(
    @Body('otp') otp: string,
    @Query('token') token: string,
  ): Promise<DoctorResponseType> {
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
  async doctorResetPasswordRequest(@Body() data: doctorProfileResetPasswordDto) {
    return this.doctorService.doctorResetPasswordRequest(data);
  }

  @Public()
  @Post('/reset-password')
  async doctorResetPassword(@Body() data: doctorProfileResetPasswordDoDto) {
    return this.doctorService.doctorResetPassword(data);
  }

  @Patch('/update-password')
  @ApiBearerAuth('access-token')
  async doctorProfileUpdatePassword(@Body() data: updatePasswordDto, @Req() req: Request) {
    const { id } = req['user'];
    return this.doctorService.doctorProfileUpdatePassword(data, +id);
  }

  @Patch('/:id/view')
  @Public()
  @HttpCode(204)
  @ApiParam({
    name: 'id',
    description: 'profile id',
    required: true,
    example: 1,
    type: 'number',
  })
  async doctorProfileView(@Param('id') id: string, @Body() data: DoctorProfileViewerDto) {
    return this.doctorService.doctorProfileView(+id, data);
  }

  @Get('/my-data')
  @ApiBearerAuth('access-token')
  async getMyData(@Req() req: Request): Promise<DoctorEntity> {
    const { id } = req['user'];
    return this.doctorService.getMyData(id);
  }

  @Get()
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

    return this.doctorService.getAllDoctors(directDoctorFilters);
  }

  @Patch('/handle-block/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth('access-token')
  async handleBlockDoctor(@Param('id') id: string): Promise<{ isActive: boolean }> {
    return this.doctorService.handleBlockDoctor(+id);
  }

  @UseGuards(AuthGuard)
  @Delete('/delete-doctor/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiBearerAuth('access-token')
  async deleteDoctor(@Param('id') id: string): Promise<{ isActive: boolean }> {
    return this.doctorService.deleteDoctor(+id);
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
    return this.doctorService.getDoctorFiltrationInfo();
  }
}
