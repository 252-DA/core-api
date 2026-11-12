import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RosterModule } from '../roster/roster.module';
import { LearnerModelService } from './learner-model.service';

@Module({
  imports: [AuthModule, PrismaModule, RosterModule],
  providers: [LearnerModelService],
  exports: [LearnerModelService],
})
export class LearningAgentModule {}
