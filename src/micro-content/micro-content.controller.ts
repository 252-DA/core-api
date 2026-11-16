import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MicroContentService } from './micro-content.service';
import { MicroContentVideoService } from './micro-content-video.service';
import { MicroContentAttemptService } from './micro-content-attempt.service';
import { BffJwtGuard } from '../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../auth/current-bff-claims.decorator';
import type { BffClaims } from '../auth/bff-claims';
import {
  ConfirmMicroContentUploadDto,
  CreateMicroContentDto,
  CreateMicroContentUploadDto,
  PublishMicroContentDto,
  ReportMicroContentProgressDto,
  RequestMicroContentOutlineDto,
  RequestMicroContentQuizDto,
  RequestMicroContentRenderDto,
  RequestMicroContentScriptDto,
  SaveMicroContentQuestionsDto,
  SaveMicroContentScriptDto,
  SubmitMicroContentDto,
  UpdateMicroContentDto,
} from './dto/micro-content.dto';

@Controller('api/micro-content')
@UseGuards(BffJwtGuard)
export class MicroContentController {
  constructor(
    private readonly microContent: MicroContentService,
    private readonly microContentVideo: MicroContentVideoService,
    private readonly microContentAttempt: MicroContentAttemptService,
  ) {}

  @Get()
  async list(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.microContent.list(claims, courseId);
  }

  @Post('outline')
  async requestOutline(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: RequestMicroContentOutlineDto,
  ) {
    return this.microContent.requestOutline(claims, body);
  }

  @Get('attempts/:attemptId/result')
  async getResult(
    @CurrentBffClaims() claims: BffClaims,
    @Param('attemptId') attemptId: string,
  ) {
    return this.microContentAttempt.getResult(claims, { attemptId });
  }

  @Post()
  async create(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: CreateMicroContentDto,
  ) {
    return this.microContent.create(claims, body);
  }

  @Get(':id')
  async get(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
  ) {
    return this.microContent.get(claims, microContentId);
  }

  @Patch(':id')
  async update(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: UpdateMicroContentDto,
  ) {
    return this.microContent.update(claims, { ...body, microContentId });
  }

  @Delete(':id')
  async delete(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
  ) {
    return this.microContent.delete(claims, microContentId);
  }

  @Post(':id/publish')
  async publish(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: PublishMicroContentDto = {},
  ) {
    return this.microContent.publish(claims, microContentId, body?.status);
  }

  @Put(':id/questions')
  async saveQuestions(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: SaveMicroContentQuestionsDto,
  ) {
    return this.microContent.saveQuestions(claims, {
      microContentId,
      questions: body.questions,
    });
  }

  @Post(':id/upload')
  async createUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: CreateMicroContentUploadDto,
  ) {
    return this.microContentVideo.createUpload(claims, { microContentId, ...body });
  }

  @Post(':id/upload/confirm')
  async confirmUpload(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: ConfirmMicroContentUploadDto = {},
  ) {
    return this.microContentVideo.confirmUpload(claims, { microContentId, ...body });
  }

  @Get(':id/video-url')
  async getVideoUrl(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
  ) {
    return this.microContentVideo.getVideoUrl(claims, { microContentId });
  }

  @Get(':id/subtitles')
  async getSubtitles(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
  ) {
    return this.microContentVideo.getSubtitlesUrl(claims, { microContentId });
  }

  @Post(':id/script')
  async requestScript(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: RequestMicroContentScriptDto = {},
  ) {
    return this.microContent.requestScript(claims, { microContentId, ...body });
  }

  @Put(':id/script')
  async saveScript(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: SaveMicroContentScriptDto,
  ) {
    return this.microContent.saveScript(claims, {
      microContentId,
      script: body.script,
    });
  }

  @Post(':id/render')
  async requestRender(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: RequestMicroContentRenderDto = {},
  ) {
    return this.microContent.requestRender(claims, {
      microContentId,
      allowFlagged: body?.allowFlagged,
    });
  }

  @Post(':id/quiz')
  async requestQuiz(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: RequestMicroContentQuizDto = {},
  ) {
    return this.microContent.requestQuiz(claims, { microContentId, ...body });
  }

  @Post(':id/progress')
  async reportProgress(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: ReportMicroContentProgressDto,
  ) {
    return this.microContentAttempt.reportProgress(claims, {
      microContentId,
      positionMs: body.positionMs,
      playedMs: body.playedMs,
    });
  }

  @Post(':id/submit')
  async submit(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
    @Body() body: SubmitMicroContentDto,
  ) {
    return this.microContentAttempt.submit(claims, {
      microContentId,
      answers: body.answers,
    });
  }

  @Get(':id/attempts')
  async listAttempts(
    @CurrentBffClaims() claims: BffClaims,
    @Param('id') microContentId: string,
  ) {
    return this.microContentAttempt.listAttempts(claims, { microContentId });
  }
}
