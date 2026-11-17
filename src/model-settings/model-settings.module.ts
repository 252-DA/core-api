import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { ModelSettingsService } from './model-settings.service';
import { ModelSettingsController } from './model-settings.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ModelSettingsController],
  providers: [ModelSettingsService],
  exports: [ModelSettingsService],
})
export class ModelSettingsModule {}
