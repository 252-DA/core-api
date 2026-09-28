import { Module } from '@nestjs/common';
import { GrpcServerService } from './grpc-server.service';
import { AuthModule } from '../auth/auth.module';
import { LtiModule } from '../lti/lti.module';
import { CourseModule } from '../course/course.module';
import { DocumentModule } from '../document/document.module';
import { LessonModule } from '../lesson/lesson.module';
import { ReviewModule } from '../review/review.module';
import { QuizModule } from '../quiz/quiz.module';
import { ContentGenerationModule } from '../content-generation/content-generation.module';
import { CurriculumModule } from '../curriculum/curriculum.module';

@Module({
  imports: [
    AuthModule,
    LtiModule,
    CourseModule,
    DocumentModule,
    LessonModule,
    ReviewModule,
    QuizModule,
    ContentGenerationModule,
    CurriculumModule,
  ],
  providers: [GrpcServerService],
})
export class GrpcModule {}
