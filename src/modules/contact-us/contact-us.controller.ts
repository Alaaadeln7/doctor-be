import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
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
import { Throttle } from '@nestjs/throttler';
import { ContactUsService } from './contact-us.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { ContactUs } from './entities/contact-us.entity';
import { AdminGuard } from '../../guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('contact-us')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Submit a contact us message',
    description:
      'Public endpoint to submit contact us messages from users. Rate limited to 3 requests per minute to prevent spam.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact message submitted successfully',
    type: ContactUs,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async create(@Body() createContactUsDto: CreateContactUsDto): Promise<ContactUs> {
    return await this.contactUsService.create(createContactUsDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all contact us messages (Admin only)',
    description: 'Retrieve all contact us messages with pagination. Only accessible by admins.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of contact messages ordered by creation date (newest first)',
    type: [ContactUs],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can access this endpoint',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return await this.contactUsService.findAll({ page, limit });
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a contact us message by ID (Admin only)',
    description: 'Retrieve a specific contact us message by its ID. Only accessible by admins.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Contact message ID (must be a positive integer)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Contact message found',
    type: ContactUs,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ID format',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can access this endpoint',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ContactUs> {
    return await this.contactUsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a contact us message (Admin only)',
    description:
      'Permanently delete a contact us message from the database. Only accessible by admins.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Contact message ID (must be a positive integer)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Contact message deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid ID format',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can access this endpoint',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.contactUsService.remove(id);
  }
}
