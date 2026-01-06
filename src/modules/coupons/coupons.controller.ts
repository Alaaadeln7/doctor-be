import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { AdminGuard } from '../../guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';
import { AuthGuard } from 'src/guards/auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('/create')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @ApiResponse({ status: 201, type: Coupon })
  @ApiResponse({ status: 409, description: 'Coupon code already exists' })
  async create(@Body() createCouponDto: CreateCouponDto, @Req() req: RequestWithUser) {
    const adminId = req.user?.id;
    return await this.couponsService.create(createCouponDto, adminId);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  @ApiResponse({ status: 200, type: [Coupon] })
  async findAll() {
    return await this.couponsService.findAll();
  }

  @Get('validate')
  @Public()
  @ApiOperation({ summary: 'Validate a coupon' })
  @ApiQuery({ name: 'code', type: String })
  @ApiQuery({ name: 'orderValue', type: Number })
  @ApiQuery({ name: 'doctorId', type: Number, required: false })
  @ApiResponse({ status: 200, type: Coupon })
  @ApiResponse({ status: 404, description: 'Invalid or inactive coupon' })
  @ApiResponse({ status: 400, description: 'Coupon expired or limit reached' })
  async validate(
    @Query('code') code: string,
    @Query('orderValue', ParseIntPipe) orderValue: number,
    @Query('doctorId', new ParseIntPipe({ optional: true })) doctorId?: number,
  ) {
    return await this.couponsService.validateCoupon(code, orderValue, doctorId);
  }

  @Post('apply-on-plan')
  @Public()
  @ApiOperation({ summary: 'Apply a coupon to a plan price' })
  @ApiResponse({
    status: 200,
    description: 'Returns the original and discounted prices',
    schema: {
      type: 'object',
      properties: {
        originalPrice: { type: 'number' },
        discountedPrice: { type: 'number' },
        discountAmount: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Coupon or Plan not found' })
  @ApiResponse({ status: 400, description: 'Validation error (expired, limit reached, etc)' })
  async applyOnPlan(@Body() applyCouponDto: ApplyCouponDto) {
    return await this.couponsService.applyCouponToPlan(
      applyCouponDto.code,
      applyCouponDto.planId,
      applyCouponDto.type,
      applyCouponDto.doctorId,
    );
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a coupon by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Coupon })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.couponsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a coupon (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Coupon deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.couponsService.remove(id);
  }
}
