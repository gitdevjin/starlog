import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please enter a valid Email address' })
  email: string;

  @IsString()
  @Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
  password: string;
}
