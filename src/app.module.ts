import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { loadRedisConfig } from './config/redis.config';
import { BullMqErrorLogger } from './infra/logging/bullmq-error-logger.service';
import { getSharedLoggerModuleParams } from './infra/logging/pino-config';
import { PrismaModule } from './infra/prisma/prisma.module';
import { QueueModule } from './messaging/queue.module';
import { CourseModule } from './course/course.module';
import { DocumentModule } from './document/document.module';
import { CanvasSyncModule } from './canvas-sync/canvas-sync.module';
import { ReviewModule } from './review/review.module';
import { OutboxModule } from './messaging/outbox/outbox.module';
import { LtiModule } from './lti/lti.module';
import { AuthModule } from './auth/auth.module';
import { LessonModule } from './lesson/lesson.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { QuizModule } from './quiz/quiz.module';
import { ContentGenerationModule } from './content-generation/content-generation.module';
import { AgsModule } from './ags/ags.module';
import { MicroContentModule } from './micro-content/micro-content.module';
import { VideoAssetModule } from './video-asset/video-asset.module';
import { WorkerResultsModule } from './messaging/worker-results/worker-results.module';
import { ModelSettingsModule } from './model-settings/model-settings.module';
import { EssayProcessorModule } from './essay-processor/essay-processor.module';
import { ChatModule } from './chat/chat.module';
import { LearningAgentModule } from './learning-agent/learning-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot(getSharedLoggerModuleParams()),
    BullModule.forRoot({
      connection: loadRedisConfig(),
    }),
    DiscoveryModule,
    QueueModule,
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
  providers: [BullMqErrorLogger],
})
export class AppModule {}
