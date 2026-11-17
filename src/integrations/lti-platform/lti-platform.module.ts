import { Module } from '@nestjs/common';
import { AGS_CONFIG, loadAgsConfig } from '../../config/ags.config';
import { AgsTokenService } from './ags-token.service';

@Module({
  providers: [
    { provide: AGS_CONFIG, useFactory: loadAgsConfig },
    AgsTokenService,
  ],
  exports: [AGS_CONFIG, AgsTokenService],
})
export class LtiPlatformModule {}
