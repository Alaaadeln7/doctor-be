/* eslint-disable */

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { paginate, Pagination } from "nestjs-typeorm-paginate";
import { addPlanDto, updatePlanDto } from "../..//shared/dtos/plan.dto";
import { PlanEntity } from "../..//shared/entities/plans.entity";
import { Repository } from "typeorm";

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepo: Repository<PlanEntity>
  ) {}

  addPlan(data: addPlanDto & { lsUpBy: number }): Promise<PlanEntity> {
    const { title, description, price, lsUpBy, type } = data;
    const addNewPlan = this.planRepo.create({
      title,
      description,
      price,
      lsUpBy,
      type,
    });
    return this.planRepo.save(addNewPlan);
  }

  async updatePlan(
    data: updatePlanDto & { lsUpBy: number },
    id: number
  ): Promise<PlanEntity> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    const updated = this.planRepo.merge(plan, data);
    return this.planRepo.save(updated);
  }

  async deletePlan(id: number): Promise<PlanEntity> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) {
      throw new NotFoundException("Plan not found");
    }
    return this.planRepo.remove(plan);
  }

  async deleteAllPlans(): Promise<void> {
    return this.planRepo.clear();
  }

  async getAllPlans(
    page: number,
    limit: number,
    localeCode: string,
    title: string,
    price: string,
    id: string
  ): Promise<Pagination<any>> {
    // ------------------------------
    // CASE 1: No localeCode → return normal fields
    // ------------------------------
    if (!localeCode) {
      const plansQuery = this.planRepo
        .createQueryBuilder("plan")
        .select(["plan.id", "plan.title", "plan.description", "plan.price"])
        .orderBy("plan.id", "ASC");

      if (id) {
        plansQuery.andWhere("plan.id = :id", { id });
      }
      if (title) {
        // Search in both en and ar fields
        plansQuery.andWhere(
          "(plan.title->>'en' ILIKE :title OR plan.title->>'ar' ILIKE :title)",
          { title: `%${title}%` }
        );
      }
      if (price) {
        // Search in both en and ar fields for price
        const numPrice = parseFloat(price);
        plansQuery.andWhere(
          "((plan.price->>'en')::numeric = :price OR (plan.price->>'ar')::numeric = :price)",
          { price: numPrice }
        );
      }

      return paginate<PlanEntity>(plansQuery, { page, limit, route: "/plan" });
    }

    // ------------------------------
    // CASE 2: localeCode exists → use JSONB fields
    // ------------------------------

    const queryBuilder = this.planRepo
      .createQueryBuilder("plan")
      .select("plan.id", "id")
      .addSelect(`plan.title ->> :localeCode`, "title")
      .addSelect(`plan.description ->> :localeCode`, "description")
      .addSelect(`plan.price ->> :localeCode`, "price")
      .setParameters({ localeCode });

    // Filters
    if (id) {
      queryBuilder.andWhere("plan.id = :id", { id });
    }
    if (title) {
      queryBuilder.andWhere(`(plan.title ->> :localeCode) ILIKE :title`, {
        title: `%${title}%`,
      });
    }
    if (price) {
      // Cast to numeric for proper comparison
      const numPrice = parseFloat(price);
      queryBuilder.andWhere(`(plan.price ->> :localeCode)::numeric = :price`, {
        price: numPrice,
      });
    }

    // ------------------------------
    // Count query (MUST match same filters)
    // ------------------------------
    const countQuery = this.planRepo
      .createQueryBuilder("plan")
      .select("COUNT(*)", "count");

    if (id) {
      countQuery.andWhere("plan.id = :id", { id });
    }
    if (title) {
      countQuery.andWhere(`(plan.title ->> :localeCode) ILIKE :title`, {
        localeCode,
        title: `%${title}%`,
      });
    }
    if (price) {
      const numPrice = parseFloat(price);
      countQuery.andWhere(`(plan.price ->> :localeCode)::numeric = :price`, {
        localeCode,
        price: numPrice,
      });
    }

    // ------------------------------
    // Execute queries
    // ------------------------------
    const [rawData, countResult] = await Promise.all([
      queryBuilder
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany(),

      countQuery.getRawOne(),
    ]);

    const count = parseInt(countResult.count, 10);

    // parse values
    const items = rawData.map((plan) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      price: plan.price ? parseFloat(plan.price) : null,
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
    if (!localeCode) {
      const plan = await this.planRepo.findOneBy({ id });
      if (!plan) {
        throw new NotFoundException("Plan not found");
      }
      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        price: plan.price,
      };
    }
    const plan = await this.planRepo
      .createQueryBuilder("plan")
      .select([
        "plan.id AS id",
        `plan.title ->> :localeCode AS title`,
        `plan.description ->> :localeCode AS description`,
        `plan.price ->> :localeCode AS price`,
      ])
      .where("plan.id = :id", { id })
      .setParameters({ localeCode })
      .getRawOne();

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      price: parseFloat(plan.price),
    };
  }

  async getTheBasicPlan(): Promise<PlanEntity | false> {
    const plan = await this.planRepo
      .createQueryBuilder("plan")
      .orderBy(`(plan.price ->> 'en')::numeric`, "ASC")
      .limit(1)
      .getOne();
    if (!plan) return false;
    return plan;
  }
}
