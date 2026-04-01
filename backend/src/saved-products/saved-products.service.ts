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

  async saveProduct(userId: string, subId2: string, folderId?: string) {
    const folderObjectId = folderId
      ? new Types.ObjectId(folderId)
      : null;

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
            folderId: folderObjectId,
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

  async getSavedProducts(userId: string, folderId?: string) {
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (folderId === 'uncategorized' || folderId === 'null') {
      filter.folderId = null;
    } else if (folderId) {
      filter.folderId = new Types.ObjectId(folderId);
    }

    return this.savedProductModel
      .find(filter)
      .sort({ createdAt: -1, subId2: 1 })
      .lean();
  }

  async moveProduct(userId: string, subId2: string, folderId: string | null) {
    return this.savedProductModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          subId2,
        },
        {
          folderId: folderId ? new Types.ObjectId(folderId) : null,
        },
        { new: true },
      )
      .lean();
  }

  async clearFolderProducts(userId: string, folderId: string) {
    return this.savedProductModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        folderId: new Types.ObjectId(folderId),
      },
      { folderId: null },
    );
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
