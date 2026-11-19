import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EssayProcessorService } from './essay-processor.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';
import {
  CreateEssayProcessorDto,
  ReceiveAssetNoticesDto,
  UpdateEssayProcessorDto,
} from './dto/essay-processor.dto';

@Controller('api/essay-processors')
@UseGuards(BffJwtGuard)
export class EssayProcessorController {
  constructor(private readonly essayProcessors: EssayProcessorService) {}

  @Post('notices')
  async receiveNotices(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: ReceiveAssetNoticesDto,
  ) {
    return this.essayProcessors.receiveNotices(claims, body);
  }

  @Get('report')
  async getReport(
    @CurrentBffClaims() claims: BffClaims,
    @Query('submissionId') submissionId = '',
    @Query('userSub') userSub = '',
  ) {
    return this.essayProcessors.getReport(claims, { submissionId, userSub });
  }

  @Post()
  async createProcessor(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateEssayProcessorDto,
  ) {
    return this.essayProcessors.createProcessor(claims, { ...body });
  }

  @Patch(':id')
  async updateProcessor(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') processorId: string,
    @Body() body: UpdateEssayProcessorDto,
  ) {
    return this.essayProcessors.updateProcessor(claims, {
      ...body,
      processorId,
    });
  }

  @Get(':id')
  async getProcessor(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') processorId: string,
  ) {
    return this.essayProcessors.getProcessor(claims, processorId);
  }
}
