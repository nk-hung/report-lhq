import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SavedProduct,
  SavedProductDocument,
} from './schemas/saved-product.schema';

@Injectable()
export class SavedProductsService {
  constructor(
    @InjectModel(SavedProduct.name)
    private readonly savedProductModel: Model<SavedProductDocument>,
  ) {}

  async saveProduct(userId: string, subId2: string) {
    const savedProduct = await this.savedProductModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          subId2,
        },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            subId2,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();

    return savedProduct;
  }

  async getSavedProducts(userId: string) {
    return this.savedProductModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, subId2: 1 })
      .lean();
  }

  async removeSavedProduct(userId: string, subId2: string) {
    const result = await this.savedProductModel.deleteOne({
      userId: new Types.ObjectId(userId),
      subId2,
    });

    return {
      deleted: result.deletedCount > 0,
      subId2,
    };
  }
}
