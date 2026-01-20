/* eslint-disable */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { DoctorEntity } from '../../shared/entities/doctors.entity';
import { WorkingHoursEntity } from '../../shared/entities/workinHours.entity';
import { GetDoctorQueriesDto } from '../../shared/dtos/doctor.dto';
import { paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class DoctorProvider {
  constructor(
    @InjectRepository(DoctorEntity)
    private readonly doctorRepo: Repository<DoctorEntity>,
    @InjectRepository(WorkingHoursEntity)
    private readonly workingHoursRepo: Repository<WorkingHoursEntity>,
  ) {}

  async findByEmailOrPhone(email: string, phone: string): Promise<DoctorEntity | null> {
    return await this.doctorRepo.findOne({
      where: [{ email }, { phone }],
    });
  }

  async findByEmail(email: string): Promise<DoctorEntity | null> {
    return await this.doctorRepo.findOne({
      where: { email },
    });
  }

  async findByEmailWithCredentials(email: string): Promise<DoctorEntity | null> {
    return await this.doctorRepo.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<DoctorEntity | null> {
    return await this.doctorRepo.findOne({ where: { id } });
  }

  async findByIdWithCredentials(id: number): Promise<DoctorEntity | null> {
    return await this.doctorRepo.findOne({
      where: { id },
    });
  }

  create(data: Partial<DoctorEntity>): DoctorEntity {
    return this.doctorRepo.create(data);
  }

  async save(doctor: DoctorEntity): Promise<DoctorEntity> {
    return await this.doctorRepo.save(doctor);
  }

  async getAllDoctors(queryObj: GetDoctorQueriesDto) {
    const qb = this.doctorRepo.createQueryBuilder('doctor');

    if (queryObj.governorate) {
      qb.andWhere("doctor.address ->> 'governorate' = :gov", {
        gov: queryObj.governorate,
      });
    }
    if (queryObj.center) {
      qb.andWhere("doctor.address ->> 'center' = :center", {
        center: queryObj.center,
      });
    }
    if (queryObj.price) {
      const { from, to } = queryObj.price;
      if (from !== undefined) {
        qb.andWhere("(doctor.clinic ->> 'price')::numeric >= :from", { from });
      }
      if (to !== undefined) {
        qb.andWhere("(doctor.clinic ->> 'price')::numeric <= :to", { to });
      }
    }

    if (queryObj.search) {
      qb.andWhere(
        `(doctor.fullName ->> 'fname' ILIKE :search OR doctor.fullName ->> 'lname' ILIKE :search OR doctor.phone ILIKE :search OR doctor.email ILIKE :search)`,
        { search: `%${queryObj.search}%` },
      );
    }

    if (queryObj.orderKey && queryObj.orderValue) {
      qb.orderBy(`doctor.${queryObj.orderKey}`, queryObj.orderValue as 'ASC' | 'DESC');
    }

    const page = queryObj.page ? Number(queryObj.page) : 1;
    const limit = queryObj.limit ? Number(queryObj.limit) : 10;

    return paginate<DoctorEntity>(qb, { page, limit, route: '/doctor' });
  }

  async executeTransaction<T>(callback: (manager: EntityManager) => Promise<T>): Promise<T> {
    return await this.doctorRepo.manager.transaction(callback);
  }

  async deleteWorkingHours(manager: EntityManager, doctor: DoctorEntity) {
    return await manager.delete(this.workingHoursRepo.target, {
      doctor,
    });
  }

  async createWorkingHours(
    manager: EntityManager,
    workingHoursData: Array<{
      day: string;
      time: { from: string; to: string };
    }>,
    doctor: DoctorEntity,
  ): Promise<WorkingHoursEntity[]> {
    return await Promise.all(
      workingHoursData.map((wh) =>
        manager.save(
          this.workingHoursRepo.create({
            day: wh.day,
            time: {
              from: wh.time.from,
              to: wh.time.to,
            },
            doctor,
          }),
        ),
      ),
    );
  }

  async getDoctorFiltrationInfo() {
    const qb = this.doctorRepo.createQueryBuilder('doctor');

    const result = await qb
      .select("MIN((doctor.clinic->>'price')::numeric)", 'minPrice')
      .addSelect("MAX((doctor.clinic->>'price')::numeric)", 'maxPrice')
      .addSelect(
        "ARRAY_AGG(DISTINCT doctor.clinic->>'paymentWay') FILTER (WHERE doctor.clinic->>'paymentWay' IS NOT NULL)",
        'paymentWays',
      )
      .getRawOne();

    return {
      minPrice: Number(result.minPrice) || 0,
      maxPrice: Number(result.maxPrice) || 0,
      paymentWays: result.paymentWays || [],
    };
  }

  async getBestDoctors() {
    const qb = this.doctorRepo.createQueryBuilder('doctor');

    return await qb
      .leftJoinAndSelect('doctor.category', 'category')
      .where('doctor.isActive = :isActive', { isActive: true })
      .andWhere('doctor.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('doctor.isVerified = :isVerified', { isVerified: true })
      .addSelect("jsonb_array_length(COALESCE(doctor.views, '[]'::jsonb))", 'viewCount')
      .orderBy('doctor.rating', 'DESC')
      .addOrderBy("jsonb_array_length(COALESCE(doctor.views, '[]'::jsonb))", 'DESC')
      .limit(4)
      .getMany();
  }

  async deleteDoctor(id: number) {
    return await this.doctorRepo.delete(id);
  }
}
