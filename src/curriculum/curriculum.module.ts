import { Module } from '@nestjs/common';
import { CourseModule } from '../course/course.module';
import { LearningOutcomeController } from './learning-outcome.controller';
import { ChapterController } from './chapter.controller';

@Module({
  imports: [CourseModule],
  controllers: [LearningOutcomeController, ChapterController],
})
export class CurriculumModule {}
