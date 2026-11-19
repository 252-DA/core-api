import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { StorageModule } from '../../infra/storage/storage.module';
import { MicroContentService } from './services/micro-content.service';
import { MicroContentVideoService } from './services/micro-content-video.service';
import { MicroContentAttemptService } from './services/micro-content-attempt.service';
import { MicroContentGradingResultHandler } from './handlers/micro-content-grading-result.handler';
import { MicroContentVideoResultHandler } from './handlers/micro-content-video-result.handler';
import { MicroContentController } from './micro-content.controller';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [MicroContentController],
  providers: [
    MicroContentService,
    MicroContentVideoService,
    MicroContentAttemptService,
    MicroContentGradingResultHandler,
    MicroContentVideoResultHandler,
  ],
  exports: [
    MicroContentService,
    MicroContentVideoService,
    MicroContentAttemptService,
  ],
})
export class MicroContentModule {}
