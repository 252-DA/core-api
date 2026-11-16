import { Type } from 'class-transformer';
import {
  IsIn,
  IsString,
  MaxLength,
  IsOptional,
  IsObject,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';

/** Claim `.../lti-nrps/claim/namesroleservice` của id_token: nơi đọc danh sách lớp. */
export class NrpsClaimDto {
  @IsString()
  @MaxLength(2048)
  contextMembershipsUrl: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceVersions?: string[];
}

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
  @IsIn(['lesson', 'card', 'quiz_set', 'chat', 'video', 'micro_content'])
  targetKind?: 'lesson' | 'card' | 'quiz_set' | 'chat' | 'video' | 'micro_content';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => NrpsClaimDto)
  nrps?: NrpsClaimDto;
}
