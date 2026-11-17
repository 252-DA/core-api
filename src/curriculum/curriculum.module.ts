import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CanvasModule } from '../integrations/canvas/canvas.module';
import { CourseModule } from '../course/course.module';
import { StorageModule } from '../infra/storage/storage.module';
import { CurriculumImportController } from './curriculum-import.controller';
import { CurriculumImportService } from './curriculum-import.service';
import { CurriculumImportResultHandler } from './curriculum-import-result.handler';

@Module({
  imports: [AuthModule, CanvasModule, CourseModule, StorageModule],
  controllers: [CurriculumImportController],
  providers: [
    CurriculumImportService,
    CurriculumImportResultHandler,
  ],
  exports: [CurriculumImportService],
})
export class CurriculumModule {}
