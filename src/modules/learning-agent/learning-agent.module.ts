import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { RosterModule } from '../roster/roster.module';
import { LearnerModelService } from './learner-model.service';
import { LearningAgentController } from './learning-agent.controller';

@Module({
  imports: [AuthModule, PrismaModule, RosterModule],
  controllers: [LearningAgentController],
  providers: [LearnerModelService],
  exports: [LearnerModelService],
})
export class LearningAgentModule {}
