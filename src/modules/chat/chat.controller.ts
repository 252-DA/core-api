import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { BffJwtGuard } from '../../auth/bff-jwt.guard';
import { CurrentBffClaims } from '../../auth/current-bff-claims.decorator';
import type { BffClaims } from '../../auth/bff-claims';
import {
  RateChatRunDto,
  RecordChatRunDto,
  SetChatModeDto,
} from './dto/chat.dto';

@Controller('api/chat')
@UseGuards(BffJwtGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('settings')
  async getSettings(@CurrentBffClaims() claims: BffClaims) {
    return this.chat.getSettings(claims);
  }

  @Put('mode')
  async setMode(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: SetChatModeDto,
  ) {
    return this.chat.setMode(claims, body);
  }

  @Post('runs')
  async recordRun(
    @CurrentBffClaims() claims: BffClaims,
    @Body() body: RecordChatRunDto,
  ) {
    return this.chat.recordRun(claims, { ...body });
  }

  @Post('runs/:runId/rate')
  async rateRun(
    @CurrentBffClaims() claims: BffClaims,
    @Param('runId') runId: string,
    @Body() body: RateChatRunDto,
  ) {
    return this.chat.rateRun(claims, { runId, rating: body.rating });
  }

  @Get('stats')
  async stats(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId?: string,
    @Query('source') source?: string,
  ) {
    return this.chat.stats(claims, { courseId, source });
  }

  @Get('catalog')
  async catalog(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.chat.catalog(claims, { courseId });
  }

  @Get('conversations')
  async listConversations(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
  ) {
    return this.chat.listConversations(claims, { courseId });
  }

  @Get('conversations/detail')
  async getConversation(
    @CurrentBffClaims() claims: BffClaims,
    @Query('courseId') courseId = '',
    @Query('conversationId') conversationId?: string,
  ) {
    return this.chat.getConversation(claims, { courseId, conversationId });
  }

  @Delete('conversations/:conversationId')
  async deleteConversation(
    @CurrentBffClaims() claims: BffClaims,
    @Param('conversationId') conversationId: string,
    @Query('courseId') courseId = '',
  ) {
    return this.chat.deleteConversation(claims, { courseId, conversationId });
  }
}
