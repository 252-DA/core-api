import { Allow, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { VerifiedNotice } from '../essay-processor.service';

export class CreateEssayProcessorDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsOptional()
  @IsString()
  activityId?: string | null;

  @IsString()
  @IsNotEmpty()
  pnsUrl!: string;

  @IsString()
  @IsNotEmpty()
  handlerUrl!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsArray()
  rubric!: unknown[];

  @IsOptional()
  @IsBoolean()
  visibleToOwner?: boolean;
}

export class UpdateEssayProcessorDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsArray()
  rubric!: unknown[];

  @IsOptional()
  @IsBoolean()
  visibleToOwner?: boolean;
}

export class ReceiveAssetNoticesDto {
  @IsArray()
  @Allow()
  notices!: VerifiedNotice[];
}
