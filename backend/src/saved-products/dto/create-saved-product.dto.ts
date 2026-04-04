import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavedProductDto {
  @ApiProperty({ example: 'DXYTuiXinh2101' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => String(value).trim())
  subId2!: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Folder ID to categorize the product',
  })
  @IsOptional()
  @IsString()
  folderId?: string;
}
