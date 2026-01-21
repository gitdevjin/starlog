import { IsString } from 'class-validator';

export class UpdateMoonDto {
  @IsString()
  content: string;
}
