import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckVideoHashDto {
  @IsString()
  fileHash!: string;
}

export class CreateVideoAssetUploadDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  filename!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  fileHash?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  courseId?: string;
}

export class ConfirmVideoAssetUploadDto {
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @IsOptional()
  @IsNumber()
  durationMs?: number;
}

export class UpdateVideoAssetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsBoolean()
  allowFork?: boolean;
}

export class ForkVideoAssetDto {
  @IsOptional()
  @IsString()
  targetCourseId?: string;

  @IsOptional()
  @IsString()
  newTitle?: string;
}

export class AttachVideoAssetDto {
  @IsString()
  microContentId!: string;

  @IsOptional()
  @IsString()
  assetId!: string | null;
}
