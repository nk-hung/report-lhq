import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSavedProductDto {
  @ApiProperty({ example: 'DXYTuiXinh2101' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => String(value).trim())
  subId2!: string;
}
