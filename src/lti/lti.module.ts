import { Module } from '@nestjs/common';
import { LtiController } from './lti.controller';
import { LtiService } from './lti.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [PrismaModule, AuthModule, DocumentModule],
  controllers: [LtiController],
  providers: [LtiService],
  exports: [LtiService],
})
export class LtiModule {}
