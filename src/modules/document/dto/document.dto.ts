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
