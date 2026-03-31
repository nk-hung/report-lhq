import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHighlightedSubIdsDto {
  @ApiProperty({
    example: ['DXYTuiXinh2101', 'ABC123'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @Transform(({ value }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
      .filter((item, index, items) => items.indexOf(item) === index);
  })
  highlightedSubIds!: string[];
}
