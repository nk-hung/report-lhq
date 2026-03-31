import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserPreferenceDocument = HydratedDocument<UserPreference>;

@Schema({ timestamps: true, collection: 'user_preferences' })
export class UserPreference {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  highlightedSubIds!: string[];
}

export const UserPreferenceSchema =
  SchemaFactory.createForClass(UserPreference);
