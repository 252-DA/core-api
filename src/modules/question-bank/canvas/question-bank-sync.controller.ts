import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { BffClaims } from '../../../auth/bff-claims';
import { BffJwtGuard } from '../../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../../auth/current-bff-claims.decorator';
import { CanvasExportDto } from '../dto/question-bank.dto';
import { QuestionBankSyncService } from './question-bank-sync.service';

@Controller('api')
@UseGuards(BffJwtGuard)
export class QuestionBankSyncController {
  constructor(private readonly sync: QuestionBankSyncService) {}

  @Post('question-banks/:id/canvas-export')
  async exportToCanvas(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: CanvasExportDto = {},
  ) {
    return this.sync.requestExport(claims, id, { courseId: body?.courseId });
  }

  @Get('question-banks/:id/sync-jobs')
  async listJobs(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.sync.listJobs(claims, id);
  }

  @Get('question-bank-sync-jobs/:id')
  async getJob(@CurrentBffClaims() claims: BffClaims, @Param('id') id: string) {
    return this.sync.getJob(claims, id);
  }

  @Get('canvas/question-banks')
  async listCanvasBanks(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId?: string,
  ) {
    return this.sync.listCanvasBanks(claims, courseId);
  }
}
