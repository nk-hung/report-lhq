import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImportDto {
  @ApiPropertyOptional({
    description: 'Import date in YYYY-MM-DD format, defaults to today',
    example: '2026-03-27',
  })
  @IsOptional()
  @IsString()
  importDate?: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  shopeeFile?: any;

  @ApiProperty({ type: 'string', format: 'binary' })
  affiliateFile?: any;
}
