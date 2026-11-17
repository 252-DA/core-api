import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
