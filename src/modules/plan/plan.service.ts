/* eslint-disable */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { addPlanDto, updatePlanDto } from '../..//shared/dtos/plan.dto';
import { PlanEntity } from '../..//shared/entities/plans.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>,
  ) {}

  addPlan(data: addPlanDto & { lsUpBy: number }): Promise<PlanEntity> {
    const { title, description, monthlyPrice, yearlyPrice, lsUpBy } = data;
    const addNewPlan = this.planRepo.create({
      title,
      description,
      monthlyPrice,
      yearlyPrice,
      lsUpBy,
    });
    return this.planRepo.save(addNewPlan);
  }

  async updatePlan(data: updatePlanDto & { lsUpBy: number }, id: number): Promise<PlanEntity> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    const updated = this.planRepo.merge(plan, data);
    return this.planRepo.save(updated);
  }

  async deletePlan(id: number): Promise<PlanEntity> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return this.planRepo.remove(plan);
  }

  async deleteAllPlans(): Promise<void> {
    return this.planRepo.clear();
  }

  async getAllPlans(page: number, limit: number, localeCode: string): Promise<Pagination<any>> {
    if (!localeCode) {
      const plansQuery = this.planRepo
        .createQueryBuilder('plan')
        .select([
          'plan.id',
          'plan.title',
          'plan.description',
          'plan.monthlyPrice',
          'plan.yearlyPrice',
        ])
        .orderBy('plan.id', 'ASC');

      return paginate<PlanEntity>(plansQuery, { page, limit, route: '/plan' });
    }

    const queryBuilder = this.planRepo
      .createQueryBuilder('plan')
      .select('plan.id', 'id')
      .addSelect(`plan.title ->> :localeCode`, 'title')
      .addSelect(`plan.description ->> :localeCode`, 'description')
      .addSelect('plan.monthlyPrice', 'monthlyPrice')
      .addSelect('plan.yearlyPrice', 'yearlyPrice')
      .setParameters({ localeCode });

    const countQuery = this.planRepo.createQueryBuilder('plan').select('COUNT(*)', 'count');

    const [rawData, countResult] = await Promise.all([
      queryBuilder
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany(),

      countQuery.getRawOne(),
    ]);

    const count = parseInt(countResult.count, 10);

    const items = rawData.map((plan) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
    }));

    return {
      items,
      meta: {
        totalItems: count,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    };
  }

  async getOnePlan(id: number, localeCode: string): Promise<any> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (localeCode) {
      return {
        id: plan.id,
        title: plan.title[localeCode],
        description: plan.description[localeCode],
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
      };
    }

    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
    };
  }

  async getTheBasicPlan(): Promise<PlanEntity | false> {
    const plan = await this.planRepo
      .createQueryBuilder('plan')
      .orderBy('plan.monthlyPrice', 'ASC')
      .limit(1)
      .getOne();
    if (!plan) return false;
    return plan;
  }
}
