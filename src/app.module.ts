import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { buildLoggerModuleParams } from './logging/pino-config';
import { PrismaModule } from './prisma/prisma.module';
import { CourseModule } from './course/course.module';
import { DocumentModule } from './document/document.module';
import { CanvasSyncModule } from './canvas-sync/canvas-sync.module';
import { ReviewModule } from './review/review.module';
import { OutboxModule } from './outbox/outbox.module';
import { LtiModule } from './lti/lti.module';
import { AuthModule } from './auth/auth.module';
import { LessonModule } from './lesson/lesson.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { QuizModule } from './quiz/quiz.module';
import { ContentGenerationModule } from './content-generation/content-generation.module';
import { AgsModule } from './ags/ags.module';
import { MicroContentModule } from './micro-content/micro-content.module';
import { VideoAssetModule } from './video-asset/video-asset.module';
import { WorkerResultsModule } from './worker-results/worker-results.module';
import { ModelSettingsModule } from './model-settings/model-settings.module';
import { EssayProcessorModule } from './essay-processor/essay-processor.module';
import { ChatModule } from './chat/chat.module';
import { LearningAgentModule } from './learning-agent/learning-agent.module';

// Parse Redis URL for BullMQ connection
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
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
    LoggerModule.forRoot(buildLoggerModuleParams()),
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    PrismaModule,
    CourseModule,
    DocumentModule,
    CanvasSyncModule,
    ReviewModule,
    OutboxModule,
    LtiModule,
    AuthModule,
    LessonModule,
    CurriculumModule,
    QuizModule,
    ContentGenerationModule,
    AgsModule,
    MicroContentModule,
    VideoAssetModule,
    WorkerResultsModule,
    ModelSettingsModule,
    EssayProcessorModule,
    ChatModule,
    LearningAgentModule,
  ],
})
export class AppModule {}
