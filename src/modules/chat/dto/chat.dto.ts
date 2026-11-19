import { Allow, IsNumber, IsOptional, IsString } from 'class-validator';

export class SetChatModeDto {
  @IsString()
  mode!: string;
}

export class RecordChatRunDto {
  @IsString()
  courseId!: string;

  @IsString()
  mode!: string;

  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @Allow()
  citations?: unknown;

  @IsOptional()
  @Allow()
  toolCalls?: unknown;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  steps?: number;

  @IsOptional()
  @IsNumber()
  inputTokens?: number;

  @IsOptional()
  @IsNumber()
  outputTokens?: number;

  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  error?: string;
}

export class RateChatRunDto {
  @IsNumber()
  rating!: number;
}
