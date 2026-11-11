import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';
import { MicroContentService } from './micro-content.service';
import { MicroContentVideoService } from './micro-content-video.service';
import { MicroContentAttemptService } from './micro-content-attempt.service';
import { MicroContentGradingResultHandler } from './micro-content-grading-result.handler';
import { MicroContentVideoResultHandler } from './micro-content-video-result.handler';

@Module({
  imports: [PrismaModule, AuthModule, DocumentModule],
  providers: [MicroContentService, MicroContentVideoService, MicroContentAttemptService,
    MicroContentGradingResultHandler, MicroContentVideoResultHandler],
  exports: [MicroContentService, MicroContentVideoService, MicroContentAttemptService],
})
export class MicroContentModule {}

