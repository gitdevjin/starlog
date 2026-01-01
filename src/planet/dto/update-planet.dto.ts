import { IsString } from 'class-validator';

export class UpdatePlanetDto {
  @IsString()
  content: string;
}
