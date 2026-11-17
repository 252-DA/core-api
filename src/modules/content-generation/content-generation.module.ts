import { Module } from '@nestjs/common';
import { ContentGenerationController } from './content-generation.controller';
import { ContentGenerationService } from './content-generation.service';
import { ContentGenerationResultHandler } from './handlers/content-generation-result.handler';
import { EnrichmentContentResultHandler } from './handlers/enrichment-content-result.handler';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ContentGenerationController],
  providers: [
    ContentGenerationService,
    ContentGenerationResultHandler,
    EnrichmentContentResultHandler,
  ],
  exports: [ContentGenerationService],
})
export class ContentGenerationModule {}
