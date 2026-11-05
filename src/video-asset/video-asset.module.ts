import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';
import { VideoAssetService } from './video-asset.service';

@Module({
  imports: [PrismaModule, AuthModule, DocumentModule],
  providers: [VideoAssetService],
  exports: [VideoAssetService],
})
export class VideoAssetModule {}

