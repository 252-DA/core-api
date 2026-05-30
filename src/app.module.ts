import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CourseModule } from './course/course.module';
import { DocumentModule } from './document/document.module';
import { ContentModule } from './content/content.module';
import { ReviewModule } from './review/review.module';
import { OutboxModule } from './outbox/outbox.module';
import { LtiModule } from './lti/lti.module';
import { AuthModule } from './auth/auth.module';
import { LessonModule } from './lesson/lesson.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { QuizModule } from './quiz/quiz.module';
import { ContentGenerationModule } from './content-generation/content-generation.module';
import { GrpcModule } from './grpc/grpc.module';

// Parse Redis URL for BullMQ connection
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
    };
  } catch (err) {
    // Fallback if URL is invalid or in a different format
    return {
      host: 'localhost',
      port: 6379,
    };
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    PrismaModule,
    CourseModule,
    DocumentModule,
    ContentModule,
    ReviewModule,
    OutboxModule,
    LtiModule,
    AuthModule,
    LessonModule,
    CurriculumModule,
    QuizModule,
    ContentGenerationModule,
    GrpcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
