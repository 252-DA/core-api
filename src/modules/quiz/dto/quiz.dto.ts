import { Allow, IsArray, IsOptional, IsString } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class SubmitQuizDto {
  @IsString()
  lessonId!: string;

  @IsOptional()
  @IsString()
  resourceLinkId?: string;

  @IsArray()
  @Allow()
  answers!: Array<{ quizId: string; chosenAnswer: unknown; responseTimeMs?: number }>;
}

export class GradeEssayAnswerDto {
  @Allow()
  score!: unknown;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class QuizBuilderContextDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  loIds?: string[];
}

export class CreateQuizSetDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chapterIds?: string[];

  @IsString()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  quizIds!: string[];

  @IsString()
  selectionId!: string;

  @IsOptional()
  @Allow()
  settings?: unknown;

  @IsOptional()
  @Allow()
  blueprint?: unknown;
}

export class StartQuizSetDto {
  @IsString()
  resourceLinkId!: string;
}

export class SubmitQuizSetDto {
  @IsString()
  resourceLinkId!: string;

  @IsArray()
  @Allow()
  answers!: Array<{ quizId: string; chosenAnswer: Prisma.InputJsonValue }>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
