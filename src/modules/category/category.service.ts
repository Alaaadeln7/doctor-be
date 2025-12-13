/* eslint-disable */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { addCategoryDto, updateCategoryDto } from '../../shared/dtos/category.dto';
import { CategoryEntity } from '../../shared/entities/categoris.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async addCategory(data: addCategoryDto, lsUpBy: number): Promise<CategoryEntity> {
    const { title, description } = data;
    const newCategory = this.categoryRepo.create({
      title,
      description,
      lsUpBy,
    });
    return this.categoryRepo.save(newCategory);
  }

  async updateCategory(
    data: updateCategoryDto,
    id: number,
    lsUpBy: number,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const { title, description } = data;
    const updated = this.categoryRepo.merge(category, {
      title,
      description,
      lsUpBy,
    });
    return this.categoryRepo.save(updated);
  }

  async deleteCategory(id: number): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.categoryRepo.remove(category);
  }

  async deleteAllCategories(): Promise<void> {
    return this.categoryRepo.clear();
  }

  async getAllCategories(
    page: number,
    limit: number,
    localeCode?: string,
    title?: string,
    id?: string,
  ): Promise<Pagination<any>> {
    if (!localeCode) {
      const queryBuilder = this.categoryRepo
        .createQueryBuilder('category')
        .orderBy('category.id', 'ASC')
        .select(['category.id', 'category.title', 'category.description']);

      // Apply filters if provided
      if (id) {
        const numericId = parseInt(id, 10);
        console.log('Filtering by ID:', numericId, 'Type:', typeof numericId);
        if (!isNaN(numericId)) {
          queryBuilder.andWhere('category.id = :id', { id: numericId });
        }
      }
      if (title) {
        queryBuilder.andWhere(
          "(category.title->>'en' ILIKE :title OR category.title->>'ar' ILIKE :title)",
          { title: `%${title}%` },
        );
      }

      // Debug: Log the SQL query
      console.log('SQL Query:', queryBuilder.getSql());
      console.log('Parameters:', queryBuilder.getParameters());

      return paginate<CategoryEntity>(queryBuilder, {
        page,
        limit,
        route: 'category',
      });
    } else {
      // When localeCode is provided, use getRawMany approach
      let query = this.categoryRepo.createQueryBuilder('category');

      // Apply ID filter first
      if (id) {
        const numericId = parseInt(id, 10);
        console.log('Filtering by ID (with locale):', numericId);
        if (!isNaN(numericId)) {
          query = query.where('category.id = :id', { id: numericId });
        }
      }

      // Apply title filter
      if (title) {
        const condition = `category.title->>'${localeCode}' ILIKE :title`;
        if (id) {
          query = query.andWhere(condition, { title: `%${title}%` });
        } else {
          query = query.where(condition, { title: `%${title}%` });
        }
      }

      // Add select after where clauses
      query = query.select([
        'category.id AS id',
        `category.title->>'${localeCode}' AS title`,
        `category.description->>'${localeCode}' AS description`,
      ]);

      // Debug: Log the SQL query
      console.log('SQL Query (locale):', query.getSql());
      console.log('Parameters (locale):', query.getParameters());

      // Get total count with same filters
      let countQuery = this.categoryRepo.createQueryBuilder('category');

      if (id) {
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
          countQuery = countQuery.where('category.id = :id', { id: numericId });
        }
      }
      if (title) {
        const condition = `category.title->>'${localeCode}' ILIKE :title`;
        if (id) {
          countQuery = countQuery.andWhere(condition, { title: `%${title}%` });
        } else {
          countQuery = countQuery.where(condition, { title: `%${title}%` });
        }
      }

      const [rawData, count] = await Promise.all([
        query
          .offset((page - 1) * limit)
          .limit(limit)
          .getRawMany(),
        countQuery.getCount(),
      ]);

      console.log('Raw data returned:', rawData);
      console.log('Count:', count);

      const items = rawData.map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
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
  }

  async getOneCategory(id: number, localeCode: string): Promise<any> {
    if (!localeCode) {
      const category = await this.categoryRepo.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return {
        id: category.id,
        title: category.title,
        description: category.description,
      };
    } else {
      const category = await this.categoryRepo
        .createQueryBuilder('category')
        .select([
          'category.id AS id',
          `category.title ->> :localeCode AS title`,
          `category.description ->> :localeCode AS description`,
        ])
        .where('category.id = :id', { id })
        .setParameters({ localeCode })
        .getRawOne();

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return {
        id: category.id,
        title: category.title,
        description: category.description,
      };
    }
  }

  async findOneCategoryForDoctor(id: number): Promise<null | CategoryEntity> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    return category ?? null;
  }
}
