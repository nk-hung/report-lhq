import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateHighlightedSubIdsDto } from './dto/update-highlighted-sub-ids.dto';
import { UserPreferencesService } from './user-preferences.service';

@ApiTags('User Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/preferences')
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get highlighted Sub IDs for the logged-in user' })
  async getPreferences(@Req() req: any) {
    return this.userPreferencesService.getPreferences(req.user.userId);
  }

  @Post('highlight')
  @ApiOperation({
    summary: 'Replace the full highlighted Sub ID list for the logged-in user',
  })
  async replaceHighlightedSubIds(
    @Req() req: any,
    @Body() dto: UpdateHighlightedSubIdsDto,
  ) {
    return this.userPreferencesService.replaceHighlightedSubIds(
      req.user.userId,
      dto.highlightedSubIds,
    );
  }

  @Delete('highlight/:subId2')
  @ApiOperation({
    summary: 'Remove one highlighted Sub ID for the logged-in user',
  })
  @ApiParam({ name: 'subId2', example: 'DXYTuiXinh2101' })
  async removeHighlightedSubId(
    @Req() req: any,
    @Param('subId2') subId2: string,
  ) {
    return this.userPreferencesService.removeHighlightedSubId(
      req.user.userId,
      subId2,
    );
  }
}
