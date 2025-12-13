import { IsString, Length } from 'class-validator';

export class CreateGitHubUserDto {
  @IsString()
  githubId: string;
}
