import { Module } from '@nestjs/common';
import { LtiController } from './lti.controller';
import { LtiService } from './lti.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CanvasSyncModule } from '../canvas-sync/canvas-sync.module';
import { RosterModule } from '../roster/roster.module';
import { CanvasModule } from '../canvas/canvas.module';

@Module({
  imports: [PrismaModule, AuthModule, CanvasSyncModule, RosterModule, CanvasModule],
  controllers: [LtiController],
  providers: [LtiService],
  exports: [LtiService],
})
export class LtiModule {}
