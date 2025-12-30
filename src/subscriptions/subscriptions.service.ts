import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const subscription = this.subscriptionRepo.create({
      ...createSubscriptionDto,
      isActive: createSubscriptionDto.isActive ?? true,
    });

    const newSubscription = await this.subscriptionRepo.save(subscription);
    return {
      data: newSubscription,
    };
  }

  async findAll(): Promise<Subscription[]> {
    return await this.subscriptionRepo.find({
      relations: ['user', 'plan'],
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: +id },
      relations: ['user', 'plan'],
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findOne(id);
    Object.assign(subscription, updateSubscriptionDto);
    return await this.subscriptionRepo.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepo.remove(subscription);
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepo.find({
      where: { userId },
      relations: ['user', 'plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    return await this.subscriptionRepo.findOne({
      where: { userId, isActive: true },
      relations: ['user', 'plan'],
      order: { expireAt: 'DESC' },
    });
  }
}
