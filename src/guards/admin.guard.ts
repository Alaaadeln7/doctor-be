import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { AdminEntity } from '../shared/entities/admins.entity';

interface AdminUser {
  id: number;
  email: string;
  role?: 'admin';
  name?: string;
  isActive?: boolean;
  pages?: unknown;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: AdminUser }).user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const admin = await this.adminRepo.findOne({
      where: { id: user.id },
    });

    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }

    if (!admin.isActive) {
      throw new ForbiddenException('Admin account is not active');
    }

    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can access this resource');
    }

    return true;
  }
}
