import { IsOptional, IsString } from 'class-validator';

export class SetModelBindingDto {
  @IsString()
  task!: string;

  @IsOptional()
  @IsString()
  profile?: string | null;
}
