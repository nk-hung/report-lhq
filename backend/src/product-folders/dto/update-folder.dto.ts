import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFolderDto {
  @ApiProperty({ example: 'Renamed Folder' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => String(value).trim())
  name!: string;
}
