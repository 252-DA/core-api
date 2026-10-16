import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';
import { MicroContentService } from './micro-content.service';
import { MicroContentVideoService } from './micro-content-video.service';
import { MicroContentAttemptService } from './micro-content-attempt.service';

@Module({
  imports: [PrismaModule, AuthModule, DocumentModule],
  providers: [MicroContentService, MicroContentVideoService, MicroContentAttemptService],
  exports: [MicroContentService, MicroContentVideoService, MicroContentAttemptService],
})
export class MicroContentModule {}

