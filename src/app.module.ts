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
import { CourseModule } from './modules/course/course.module';
import { DocumentModule } from './modules/document/document.module';
import { CanvasSyncModule } from './modules/canvas-sync/canvas-sync.module';
import { ReviewModule } from './modules/review/review.module';
import { OutboxModule } from './messaging/outbox/outbox.module';
import { LtiModule } from './modules/lti/lti.module';
import { AuthModule } from './auth/auth.module';
import { LessonModule } from './modules/lesson/lesson.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { ContentGenerationModule } from './modules/content-generation/content-generation.module';
import { AgsModule } from './modules/ags/ags.module';
import { MicroContentModule } from './modules/micro-content/micro-content.module';
import { VideoAssetModule } from './modules/video-asset/video-asset.module';
import { WorkerResultsModule } from './messaging/worker-results/worker-results.module';
import { ModelSettingsModule } from './modules/model-settings/model-settings.module';
import { EssayProcessorModule } from './modules/essay-processor/essay-processor.module';
import { ChatModule } from './modules/chat/chat.module';
import { LearningAgentModule } from './modules/learning-agent/learning-agent.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';

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
    QuestionBankModule,
  ],
  providers: [BullMqErrorLogger],
})
export class AppModule {}
