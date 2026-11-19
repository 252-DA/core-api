import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { QuizController } from './controllers/quiz.controller';
import { QuizSetController } from './controllers/quiz-set.controller';
import { QuizService } from './services/quiz.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { CanvasModule } from '../../integrations/canvas/canvas.module';
import { RosterModule } from '../roster/roster.module';
import { QuizSetService } from './services/quiz-set.service';
import { EssayGradingService } from './services/essay-grading.service';
import { QuizGradingResultHandler } from './handlers/quiz-grading-result.handler';

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
