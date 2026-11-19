import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { BffClaims } from '../../auth/bff-claims';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import {
  CreateQuestionBankDto,
  CreateQuestionBankItemDto,
  ForkQuestionBankItemDto,
  RetireQuestionBankItemDto,
  ShareQuestionBankDto,
  UnshareQuestionBankDto,
  UpdateQuestionBankDto,
} from './dto/question-bank.dto';
import { QuestionBankService } from './question-bank.service';

@Controller('api')
@UseGuards(BffJwtGuard)
export class QuestionBankController {
  constructor(private readonly questionBanks: QuestionBankService) {}

  @Get('question-banks')
  async listBanks(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId?: string,
  ) {
    return this.questionBanks.listBanks(claims, courseId);
  }

  @Post('question-banks')
  async createBank(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateQuestionBankDto,
  ) {
    return this.questionBanks.createBank(claims, body);
  }

  @Patch('question-banks/:id')
  async updateBank(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: UpdateQuestionBankDto,
  ) {
    return this.questionBanks.updateBank(claims, id, body);
  }

  @Get('question-banks/:id/items')
  async listItems(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Query('lo') lo?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('origin') origin?: string,
    @Query('search') search?: string,
  ) {
    return this.questionBanks.listItems(claims, id, {
      lo,
      type,
      status,
      origin,
      search,
    });
  }

  @Post('question-banks/:id/items')
  async createItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: CreateQuestionBankItemDto,
  ) {
    return this.questionBanks.createItem(claims, id, body);
  }

  @Get('question-banks/:id/share-candidates')
  async shareCandidates(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.questionBanks.shareCandidates(claims, id);
  }

  @Post('question-banks/:id/shares')
  async share(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Body() body: ShareQuestionBankDto,
  ) {
    return this.questionBanks.share(claims, id, body);
  }

  @Delete('question-banks/:id/shares')
  async unshare(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Query('granteeType') qGranteeType?: string,
    @Query('granteeId') qGranteeId?: string,
    @Body() body: UnshareQuestionBankDto = {},
  ) {
    return this.questionBanks.unshare(claims, id, {
      granteeType: qGranteeType ?? body?.granteeType,
      granteeId: qGranteeId ?? body?.granteeId,
    });
  }

  @Post('question-banks/:id/items/:quizId/fork')
  async forkItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Param('quizId') quizId: string,
    @Body() body: ForkQuestionBankItemDto,
  ) {
    return this.questionBanks.forkItem(claims, id, quizId, body);
  }

  @Post('question-banks/:id/items/:quizId/retire')
  async retireItem(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
    @Param('quizId') quizId: string,
    @Body() body: RetireQuestionBankItemDto = {},
  ) {
    return this.questionBanks.retireItem(claims, id, quizId, body);
  }

  @Get('quiz-items/:id/versions')
  async listVersions(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') id: string,
  ) {
    return this.questionBanks.listVersions(claims, id);
  }
}
