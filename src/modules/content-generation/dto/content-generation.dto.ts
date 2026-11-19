import { Allow, IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContentGenerationDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsIn(['card', 'quiz', 'relations'])
  type!: 'card' | 'quiz' | 'relations';

  @IsOptional()
  @Allow()
  scope?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @Allow()
  scopes?: Array<Record<string, unknown>>;
}
