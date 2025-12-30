import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtUtilService } from '../common/utils/jwt.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtUtilService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

    if (isPublic) return Promise.resolve(true);

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = this.jwtService.verifyToken(token) as {
        email: string;
        id: number;
        role?: string;
        name?: string;
        isActive?: boolean;
        pages?: unknown;
      } | null;

      (request as Request & { user?: unknown }).user = decodedToken;
      return Promise.resolve(true);
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
