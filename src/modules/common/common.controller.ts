import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Public } from '../..//common/decorators/public.decorator';
import { ResendOtpCodeDto, ResendOtpResponseDto } from '../..//shared/dtos/common.dto';
import { CommonService } from './common.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post('/resend-otp-code')
  @Public()
  @HttpCode(200)
  async resendOtpCode(@Body() data: ResendOtpCodeDto): Promise<ResendOtpResponseDto> {
    return this.commonService.resendOtpCode(data);
  }

  @Get('signup-essentials')
  @Public()
  @HttpCode(200)
  getSignupEssentials() {
    return this.commonService.createNewAccountEssentials();
  }

  @Get('analytics')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  async getDashboardAnalytics() {
    const analytics = await this.commonService.getDashboardAnalytics();
    return analytics;
  }
}
