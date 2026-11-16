import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUploadSessionDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  title!: string;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  checksum?: string;
}

export class RegisterDocumentDto {
  @IsString()
  title!: string;

  @IsString()
  file_path!: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsString()
  @IsNotEmpty()
  course_id!: string;
}

export class SyncCanvasDocumentsDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;
}

export class UpdateDocumentPlacementDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  chapterCode?: string | null;
}
