import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CourseModule } from '../course/course.module';
import { LearningOutcomeController } from './learning-outcome.controller';
import { ChapterController } from './chapter.controller';

@Module({
  imports: [AuthModule, CourseModule],
  controllers: [LearningOutcomeController, ChapterController],
})
export class CurriculumModule {}
