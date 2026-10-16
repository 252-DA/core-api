import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentModule } from '../document/document.module';
import { MicroContentService } from './micro-content.service';
import { MicroContentVideoService } from './micro-content-video.service';

@Module({
  imports: [PrismaModule, AuthModule, DocumentModule],
  providers: [MicroContentService, MicroContentVideoService],
  exports: [MicroContentService, MicroContentVideoService],
})
export class MicroContentModule {}

