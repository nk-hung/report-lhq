import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SavedProductDocument = HydratedDocument<SavedProduct>;

@Schema({ timestamps: true, collection: 'saved_products' })
export class SavedProduct {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  subId2!: string;
}

export const SavedProductSchema = SchemaFactory.createForClass(SavedProduct);

SavedProductSchema.index({ userId: 1, subId2: 1 }, { unique: true });
