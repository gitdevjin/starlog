import { IsOptional, IsString } from 'class-validator';

export class CreateMoonDto {
  @IsString()
  content: string;

  @IsOptional()
  parentMoonId?: number;
}
