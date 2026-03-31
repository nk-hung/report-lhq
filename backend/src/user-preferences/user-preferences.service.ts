import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserPreference,
  UserPreferenceDocument,
} from './schemas/user-preference.schema';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectModel(UserPreference.name)
    private readonly userPreferenceModel: Model<UserPreferenceDocument>,
  ) {}

  async getPreferences(userId: string) {
    const preference = await this.userPreferenceModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();

    return {
      highlightedSubIds: preference?.highlightedSubIds || [],
    };
  }

  async replaceHighlightedSubIds(userId: string, highlightedSubIds: string[]) {
    const preference = await this.userPreferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { highlightedSubIds } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();

    return {
      highlightedSubIds: preference?.highlightedSubIds || [],
    };
  }

  async removeHighlightedSubId(userId: string, subId2: string) {
    const preference = await this.userPreferenceModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $pull: { highlightedSubIds: subId2 } },
        { new: true },
      )
      .lean();

    return {
      highlightedSubIds: preference?.highlightedSubIds || [],
    };
  }
}
