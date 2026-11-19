import { Allow, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateQuestionBankDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  homeCourseId?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @Allow()
  description?: string | null;

  @IsOptional()
  @IsString()
  visibility?: string;
}

export class UpdateQuestionBankDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Allow()
  description?: string | null;

  @IsOptional()
  @IsString()
  visibility?: string;
}

export class CreateQuestionBankItemDto {
  @IsString()
  type!: string;

  @IsString()
  question!: string;

  @IsOptional()
  @Allow()
  options?: unknown;

  @Allow()
  correct_answer!: unknown;

  @IsOptional()
  @Allow()
  explanation?: string | null;

  @IsOptional()
  @Allow()
  loId?: string | null;

  @IsOptional()
  @Allow()
  bloomLevel?: number | null;
}

export class ShareQuestionBankDto {
  @IsString()
  granteeType!: string;

  @IsString()
  granteeId!: string;

  @IsString()
  role!: string;
}

export class UnshareQuestionBankDto {
  @IsOptional()
  @IsString()
  granteeType?: string;

  @IsOptional()
  @IsString()
  granteeId?: string;
}

export class RetireQuestionBankItemDto {
  @IsOptional()
  @IsBoolean()
  restore?: boolean;
}
