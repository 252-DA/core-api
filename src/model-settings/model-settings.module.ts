import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ModelSettingsService } from './model-settings.service';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [ModelSettingsService],
  exports: [ModelSettingsService],
})
export class ModelSettingsModule {}
