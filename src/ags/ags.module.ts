import { Module } from '@nestjs/common';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { LtiPlatformModule } from '../integrations/lti-platform/lti-platform.module';
import { AgsClientService } from './ags-client.service';
import { AgsPublisherService } from './ags-publisher.service';

@Module({
  imports: [PrismaModule, LtiPlatformModule],
  providers: [AgsClientService, AgsPublisherService],
  // Token LTI Advantage dùng chung cho mọi dịch vụ của platform (AGS, Asset
  // Processor), không riêng chấm điểm.
  exports: [AgsPublisherService, LtiPlatformModule],
})
export class AgsModule {}
