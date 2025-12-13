// credential.module.ts
import { Module } from '@nestjs/common';
import { CredentialEntity } from '../../shared/entities/credentials.entity';
import { CredentialService } from './credential.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BcryptUtilService } from '../../common/utils/bcrypt.util';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialEntity])],
  providers: [CredentialService, BcryptUtilService],
  exports: [CredentialService, TypeOrmModule],
})
export class CredentialModule {}
