import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { QuizController } from './quiz.controller';
import { QuizSetController } from './quiz-set.controller';
import { QuizService } from './quiz.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { CanvasModule } from '../../integrations/canvas/canvas.module';
import { RosterModule } from '../roster/roster.module';
import { QuizSetService } from './quiz-set.service';
import { EssayGradingService } from './essay-grading.service';
import { QuizGradingResultHandler } from './quiz-grading-result.handler';

@Module({
  imports: [AuthModule, PrismaModule, CanvasModule, AgsModule, RosterModule],
  controllers: [QuizController, QuizSetController],
  providers: [
    QuizService,
    QuizSetService,
    EssayGradingService,
    QuizGradingResultHandler,
  ],
  exports: [QuizService, QuizSetService, EssayGradingService],
})
export class QuizModule {}
