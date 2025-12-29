import { IsString } from 'class-validator';

export class CreatePlanetDto {
  @IsString()
  content: string;
}
