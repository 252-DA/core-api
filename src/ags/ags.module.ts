import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AGS_CONFIG, loadAgsConfig } from './ags.config';
import { AgsTokenService } from './ags-token.service';
import { AgsClientService } from './ags-client.service';
import { AgsPublisherService } from './ags-publisher.service';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: AGS_CONFIG, useFactory: loadAgsConfig },
    AgsTokenService,
    AgsClientService,
    AgsPublisherService,
  ],
  exports: [AgsPublisherService],
})
export class AgsModule {}
