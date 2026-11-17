import {
  Allow,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { QuestionInput } from '../micro-content.types';
import type { SubmitAnswerInput } from '../services/micro-content-attempt.service';

export class CreateMicroContentDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['UPLOAD', 'AI'])
  videoSource?: 'UPLOAD' | 'AI';

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  requiredWatchPercent?: number;

  @IsOptional()
  @IsString()
  sourceDocumentId?: string | null;

  @IsOptional()
  @IsNumber()
  sourcePageFrom?: number | null;

  @IsOptional()
  @IsNumber()
  sourcePageTo?: number | null;

  @IsOptional()
  @IsString()
  loId?: string | null;

  @IsOptional()
  @IsNumber()
  position?: number | null;
}

export class UpdateMicroContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsNumber()
  requiredWatchPercent?: number;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @Allow()
  aiOptions?: unknown;

  @IsOptional()
  @IsString()
  sourceDocumentId?: string | null;

  @IsOptional()
  @IsNumber()
  sourcePageFrom?: number | null;

  @IsOptional()
  @IsNumber()
  sourcePageTo?: number | null;

  @IsOptional()
  @IsString()
  loId?: string | null;

  @IsOptional()
  @IsNumber()
  position?: number | null;
}

export class PublishMicroContentDto {
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED'])
  status?: 'DRAFT' | 'PUBLISHED';
}

export class SaveMicroContentQuestionsDto {
  @IsArray()
  @Allow()
  questions!: QuestionInput[];
}

export class CreateMicroContentUploadDto {
  @IsString()
  filename!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class ConfirmMicroContentUploadDto {
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @IsOptional()
  @IsNumber()
  durationMs?: number;
}

export class RequestMicroContentOutlineDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;
}

export class RequestMicroContentScriptDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @Allow()
  options?: unknown;
}

export class SaveMicroContentScriptDto {
  @Allow()
  script!: unknown;
}

export class RequestMicroContentRenderDto {
  @IsOptional()
  @IsBoolean()
  allowFlagged?: boolean;
}

export class RequestMicroContentQuizDto {
  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];
}

export class ReportMicroContentProgressDto {
  @IsNumber()
  positionMs!: number;

  @IsOptional()
  @IsNumber()
  playedMs?: number;
}

export class SubmitMicroContentDto {
  @IsArray()
  @Allow()
  answers!: SubmitAnswerInput[];
}
