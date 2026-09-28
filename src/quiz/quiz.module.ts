import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CanvasModule } from '../canvas/canvas.module';
import { QuizSetService } from './quiz-set.service';

@Module({
  imports: [AuthModule, PrismaModule, CanvasModule, AgsModule],
  controllers: [QuizController],
  providers: [QuizService, QuizSetService],
  exports: [QuizService, QuizSetService],
})
export class QuizModule {}
