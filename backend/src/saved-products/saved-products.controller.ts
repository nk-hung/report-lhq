import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateSavedProductDto } from './dto/create-saved-product.dto';
import { SavedProductsService } from './saved-products.service';

@ApiTags('Saved Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-products')
export class SavedProductsController {
  constructor(private readonly savedProductsService: SavedProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Save a product for the logged-in user' })
  async saveProduct(@Req() req: any, @Body() dto: CreateSavedProductDto) {
    return this.savedProductsService.saveProduct(
      req.user.userId,
      dto.subId2,
      dto.folderId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get saved products for the logged-in user' })
  @ApiQuery({
    name: 'folderId',
    required: false,
    description:
      'Filter by folder ID. Use "uncategorized" for products without a folder.',
  })
  async getSavedProducts(
    @Req() req: any,
    @Query('folderId') folderId?: string,
  ) {
    return this.savedProductsService.getSavedProducts(
      req.user.userId,
      folderId,
    );
  }

  @Patch(':subId2/move')
  @ApiOperation({ summary: 'Move a saved product to a different folder' })
  @ApiParam({ name: 'subId2', example: 'DXYTuiXinh2101' })
  async moveProduct(
    @Req() req: any,
    @Param('subId2') subId2: string,
    @Body() body: { folderId: string | null },
  ) {
    return this.savedProductsService.moveProduct(
      req.user.userId,
      subId2,
      body.folderId,
    );
  }

  @Delete(':subId2')
  @ApiOperation({ summary: 'Remove a saved product for the logged-in user' })
  @ApiParam({ name: 'subId2', example: 'DXYTuiXinh2101' })
  async removeSavedProduct(
    @Req() req: any,
    @Param('subId2') subId2: string,
  ) {
    return this.savedProductsService.removeSavedProduct(
      req.user.userId,
      subId2,
    );
  }
}
