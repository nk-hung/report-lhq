import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProductFolder,
  ProductFolderDocument,
} from './schemas/product-folder.schema';

@Injectable()
export class ProductFoldersService {
  constructor(
    @InjectModel(ProductFolder.name)
    private readonly productFolderModel: Model<ProductFolderDocument>,
  ) {}

  async createFolder(userId: string, name: string) {
    const folder = await this.productFolderModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          name,
        },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            name,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();

    return folder;
  }

  async getFolders(userId: string) {
    return this.productFolderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ name: 1 })
      .lean();
  }

  async updateFolder(userId: string, folderId: string, name: string) {
    const folder = await this.productFolderModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(folderId),
          userId: new Types.ObjectId(userId),
        },
        { name },
        { new: true },
      )
      .lean();

    return folder;
  }

  async deleteFolder(userId: string, folderId: string) {
    const result = await this.productFolderModel.deleteOne({
      _id: new Types.ObjectId(folderId),
      userId: new Types.ObjectId(userId),
    });

    return {
      deleted: result.deletedCount > 0,
    };
  }
}
