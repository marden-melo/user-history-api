import { Exclude, Expose } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  Matches,
  IsOptional,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../users.entity';

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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refreshTokenHash?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resetPasswordToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  resetPasswordExpires?: Date;
}

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty({ enum: UserRole })
  @Expose()
  role: UserRole;

  @Exclude()
  password: string;

  @Exclude()
  refreshTokenHash: string;

  @Exclude()
  resetPasswordToken: string;

  @Exclude()
  resetPasswordExpires: Date;
}
