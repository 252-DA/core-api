import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MicroContentService } from './micro-content.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MicroContentService],
  exports: [MicroContentService],
})
export class MicroContentModule {}
