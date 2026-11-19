import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurriculumImportService } from './services/curriculum-import.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';
import { parseOptionalInt } from '../../common/utils/query-params';
import { SyncCurriculumDto } from './dto/curriculum-import.dto';

@Controller('api/curriculum')
@UseGuards(BffJwtGuard)
export class CurriculumImportController {
  constructor(private readonly curriculumImports: CurriculumImportService) {}

  @Post('sync-canvas')
  async syncFromCanvas(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: SyncCurriculumDto,
  ) {
    return this.curriculumImports.syncFromCanvas(claims, body.courseId);
  }

  @Get('imports')
  async listImports(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
    @Query('limit') limit?: string,
  ) {
    return this.curriculumImports.listImports(
      claims,
      courseId,
      parseOptionalInt(limit, 'limit'),
    );
  }

  @Post('imports/:id/apply')
  async applyImport(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') importId: string,
  ) {
    return this.curriculumImports.applyImport(claims, importId);
  }
}
