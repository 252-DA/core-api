import { Module } from '@nestjs/common';
import { CanvasApiClient } from './canvas-api.client';
import { CanvasCourseService } from './canvas-course.service';

@Module({
  providers: [CanvasApiClient, CanvasCourseService],
  exports: [CanvasApiClient, CanvasCourseService],
})
export class CanvasModule {}
