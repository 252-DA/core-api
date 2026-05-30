import {
  IsIn,
  IsString,
  MaxLength,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';

export class LaunchSyncDto {
  @IsIn(['openedx', 'moodle', 'canvas'])
  lmsType: 'openedx' | 'moodle' | 'canvas';

  @IsString()
  @MaxLength(255)
  lmsSub: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsIn(['instructor', 'learner', 'administrator'])
  role: 'instructor' | 'learner' | 'administrator';

  @IsIn(['instructor', 'learner', 'ta', 'observer'])
  courseRole: 'instructor' | 'learner' | 'ta' | 'observer';

  @IsString()
  @MaxLength(255)
  lmsContextId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contextTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceLinkId?: string;

  @IsOptional()
  @IsIn(['lesson', 'card', 'quiz_set', 'chat', 'video'])
  targetKind?: 'lesson' | 'card' | 'quiz_set' | 'chat' | 'video';

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsObject()
  customClaims?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  agsLineItemUrl?: string;

  @IsOptional()
  @IsNumber()
  agsScoreMaximum?: number;

  @IsOptional()
  @IsString()
  agsLabel?: string;
}
