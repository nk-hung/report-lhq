import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { UploadImportDto } from './dto/upload-import.dto';

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload shopee XLSX and affiliate CSV files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'shopeeFile', maxCount: 1 },
      { name: 'affiliateFile', maxCount: 1 },
    ]),
  )
  async upload(
    @UploadedFiles()
    files: {
      shopeeFile?: Express.Multer.File[];
      affiliateFile?: Express.Multer.File[];
    },
    @Body() dto: UploadImportDto,
    @Req() req: any,
  ) {
    const shopeeFile = files.shopeeFile?.[0];
    const affiliateFile = files.affiliateFile?.[0];

    return this.importService.processUpload(
      shopeeFile as Express.Multer.File,
      affiliateFile as Express.Multer.File,
      dto.importDate,
      req.user.userId,
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all import sessions for the current user' })
  async getSessions(@Req() req: any) {
    return this.importService.getSessions(req.user.userId);
  }

  @Delete('sessions/:id')
  @ApiOperation({
    summary: 'Delete an import session and its records, recalculate importOrder',
  })
  async deleteSession(@Param('id') id: string, @Req() req: any) {
    return this.importService.deleteSession(id, req.user.userId);
  }
}
