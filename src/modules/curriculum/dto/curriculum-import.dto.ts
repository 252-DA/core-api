import { IsNotEmpty, IsString } from 'class-validator';

export class SyncCurriculumDto {
  @IsString()
  @IsNotEmpty()
  courseId!: string;
}
