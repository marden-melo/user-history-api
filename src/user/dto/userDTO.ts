import { Exclude } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'user/users.entity';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,}$/, {
    message: 'A senha deve conter letras, números e símbolos',
  })
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @MinLength(6)
  @IsOptional()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~/-]).{6,}$/, {
    message: 'A senha deve conter letras, números e símbolos',
  })
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @Exclude()
  password: string;
}
