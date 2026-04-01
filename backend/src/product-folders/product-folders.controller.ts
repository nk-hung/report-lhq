import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ProductFoldersService } from './product-folders.service';
import { SavedProductsService } from '../saved-products/saved-products.service';

@ApiTags('Product Folders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-folders')
export class ProductFoldersController {
  constructor(
    private readonly productFoldersService: ProductFoldersService,
    private readonly savedProductsService: SavedProductsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product folder for the logged-in user' })
  async createFolder(@Req() req: any, @Body() dto: CreateFolderDto) {
    return this.productFoldersService.createFolder(req.user.userId, dto.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product folders for the logged-in user' })
  async getFolders(@Req() req: any) {
    return this.productFoldersService.getFolders(req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product folder name' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  async updateFolder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.productFoldersService.updateFolder(
      req.user.userId,
      id,
      dto.name,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product folder' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  async deleteFolder(@Req() req: any, @Param('id') id: string) {
    await this.savedProductsService.clearFolderProducts(req.user.userId, id);
    return this.productFoldersService.deleteFolder(req.user.userId, id);
  }
}
