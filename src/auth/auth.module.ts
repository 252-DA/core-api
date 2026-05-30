import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BffJwtService } from './bff-jwt.service';
import { BffJwtGuard } from './bff-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthzService } from './authz.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [BffJwtService, BffJwtGuard, AuthzService],
  exports: [BffJwtService, BffJwtGuard, AuthzService],
})
export class AuthModule {}
