import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return await this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all subscriptions (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of subscriptions', type: [Subscription] })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can access this endpoint' })
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Subscription[]> {
    return await this.subscriptionsService.findAll();
  }

  @Get('user/:userId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all subscriptions for a specific user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of user subscriptions', type: [Subscription] })
  @HttpCode(HttpStatus.OK)
  async findByUserId(@Param('userId') userId: string): Promise<Subscription[]> {
    return await this.subscriptionsService.findByUserId(userId);
  }

  @Get('user/:userId/active')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get active subscription for a specific user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Active subscription', type: Subscription })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @HttpCode(HttpStatus.OK)
  async findActiveByUserId(@Param('userId') userId: string): Promise<Subscription | null> {
    return await this.subscriptionsService.findActiveByUserId(userId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription found', type: Subscription })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Subscription> {
    return await this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'id', type: Number, description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully', type: Subscription })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    return await this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'id', type: Number, description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.subscriptionsService.remove(id);
  }
}
