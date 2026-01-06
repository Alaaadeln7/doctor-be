import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Coupon, DiscountType } from './entities/coupon.entity';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { PlanEntity } from '../../shared/entities/plans.entity';
import { SubscriptionType } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(DoctorEntity)
    private readonly doctorRepository: Repository<DoctorEntity>,
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async create(createCouponDto: CreateCouponDto, adminId?: number): Promise<Coupon> {
    const { doctorId } = createCouponDto;

    let generatedCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      generatedCode = Math.random().toString(36).substring(2, 9).toUpperCase();
      const existing = await this.couponRepository.findOne({ where: { code: generatedCode } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new InternalServerErrorException(
        'Failed to generate a unique coupon code. Please try again.',
      );
    }

    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['coupon'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    if (doctor.coupon) {
      throw new ConflictException(`Doctor already has an assigned coupon: ${doctor.coupon.code}`);
    }

    const coupon = this.couponRepository.create({
      code: generatedCode!,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      isActive: true,
      lsUpBy: adminId,
      doctor: doctor,
    });

    return await this.couponRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return await this.couponRepository.find({
      relations: ['doctor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  /**
   * Validates a coupon code against an order
   */
  async validateCoupon(code: string, orderValue: number, doctorId?: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true },
      relations: ['doctor'],
    });

    if (!coupon) {
      throw new NotFoundException('Invalid or inactive coupon code');
    }

    // If coupon is doctor-specific, check if it matches the current doctor context (if applicable)
    if (coupon.doctor && doctorId && coupon.doctor.id !== doctorId) {
      throw new BadRequestException('This coupon is not valid for this doctor');
    }

    // Check expiry
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check minimum order value
    if (orderValue < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value of ${coupon.minOrderValue} required to use this coupon`,
      );
    }

    return coupon;
  }

  /**
   * Applies a coupon to a plan and returns the discounted price
   */
  async applyCouponToPlan(
    code: string,
    planId: number,
    type: SubscriptionType,
    doctorId?: number,
  ): Promise<{ originalPrice: number; discountedPrice: number; discountAmount: number }> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const originalPrice = type === SubscriptionType.MONTHLY ? plan.monthlyPrice : plan.yearlyPrice;

    const coupon = await this.validateCoupon(code, originalPrice, doctorId);
    const discountAmount = this.calculateDiscount(coupon, originalPrice);
    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    return {
      originalPrice,
      discountedPrice,
      discountAmount,
    };
  }

  /**
   * Safely increments usage count
   */
  async incrementUsage(id: number): Promise<void> {
    await this.couponRepository.increment({ id }, 'usageCount', 1);
  }

  /**
   * Calculates the discount for a given order value
   */
  calculateDiscount(coupon: Coupon, orderValue: number): number {
    const discountValue = Number(coupon.discountValue);
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const discount = (orderValue * discountValue) / 100;
      return Math.min(discount, orderValue);
    } else {
      return Math.min(discountValue, orderValue);
    }
  }
}
