import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductFolder,
  ProductFolderSchema,
} from './schemas/product-folder.schema';
import { ProductFoldersController } from './product-folders.controller';
import { ProductFoldersService } from './product-folders.service';
import { SavedProductsModule } from '../saved-products/saved-products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductFolder.name, schema: ProductFolderSchema },
    ]),
    forwardRef(() => SavedProductsModule),
  ],
  controllers: [ProductFoldersController],
  providers: [ProductFoldersService],
  exports: [ProductFoldersService],
})
export class ProductFoldersModule {}
