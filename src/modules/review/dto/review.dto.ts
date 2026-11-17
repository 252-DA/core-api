import { Allow, IsArray, IsOptional, IsString } from 'class-validator';

export class RejectReasonDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCardDto {
  @Allow()
  content!: unknown;
}

export class ApproveQuizBatchDto {
  @IsArray()
  @IsString({ each: true })
  quizIds!: string[];
}

export class UpdateQuizItemDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @Allow()
  options?: unknown;

  @IsOptional()
  @Allow()
  correct_answer?: unknown;

  @IsOptional()
  @IsString()
  explanation?: string;
}
