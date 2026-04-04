import { Controller, Get, Delete, UseGuards, Req, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReportService } from './report.service';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('total')
  @ApiOperation({
    summary: 'Get cumulative totals of CP and DT across all imports',
  })
  async getTotal(@Req() req: any) {
    return this.reportService.getTotal(req.user.userId);
  }

  @Get('expend')
  @ApiOperation({
    summary: 'Get expenditure breakdown from xlsx data grouped by subId',
  })
  async getExpend(@Req() req: any) {
    return this.reportService.getExpend(req.user.userId);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue breakdown from csv data grouped by subId',
  })
  async getRevenue(@Req() req: any) {
    return this.reportService.getRevenue(req.user.userId);
  }

  @Get('compare')
  @ApiOperation({
    summary:
      'Get comparison report with TCP, TDT, TLN and daily breakdown. Use sessionId to paginate between import sessions and campaignName to filter subIds by current session campaign name.',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description:
      'Optional import session id. If invalid or not found for the user, the latest session is used.',
  })
  @ApiQuery({
    name: 'campaignName',
    required: false,
    description:
      'Optional campaign name keyword for case-insensitive contains filtering on current session records',
  })
  async getCompare(
    @Req() req: any,
    @Query('sessionId') sessionId?: string,
    @Query('campaignName') campaignName?: string,
  ) {
    return this.reportService.getCompare(
      req.user.userId,
      sessionId,
      campaignName,
    );
  }
}

@ApiTags('Reset')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reset')
export class ResetController {
  constructor(private readonly reportService: ReportService) {}

  @Delete()
  @ApiOperation({ summary: 'Delete all data for the logged-in user' })
  async reset(@Req() req: any) {
    return this.reportService.resetData(req.user.userId);
  }
}
