import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { CanvasModule } from '../canvas/canvas.module';
import { CourseModule } from '../course/course.module';
import { StorageModule } from '../storage/storage.module';
import { CurriculumImportController } from './curriculum-import.controller';
import { CurriculumImportService } from './curriculum-import.service';
import { CurriculumImportResultHandler } from './curriculum-import-result.handler';

@Module({
  imports: [
    AuthModule,
    CanvasModule,
    CourseModule,
    StorageModule,
    BullModule.registerQueue({ name: 'document_processing' }),
  ],
  controllers: [CurriculumImportController],
  providers: [
    CurriculumImportService,
    CurriculumImportResultHandler,
  ],
  exports: [CurriculumImportService],
})
export class CurriculumModule {}
