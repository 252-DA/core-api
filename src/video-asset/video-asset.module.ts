import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { VideoAssetService } from './video-asset.service';
import { VideoAssetController } from './video-asset.controller';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [VideoAssetController],
  providers: [VideoAssetService],
  exports: [VideoAssetService],
})
export class VideoAssetModule {}

