import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SavedProduct,
  SavedProductSchema,
} from './schemas/saved-product.schema';
import { SavedProductsController } from './saved-products.controller';
import { SavedProductsService } from './saved-products.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedProduct.name, schema: SavedProductSchema },
    ]),
  ],
  controllers: [SavedProductsController],
  providers: [SavedProductsService],
  exports: [SavedProductsService],
})
export class SavedProductsModule {}
