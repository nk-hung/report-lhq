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
    return this.savedProductsService.saveProduct(req.user.userId, dto.subId2);
  }

  @Get()
  @ApiOperation({ summary: 'Get saved products for the logged-in user' })
  async getSavedProducts(@Req() req: any) {
    return this.savedProductsService.getSavedProducts(req.user.userId);
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
