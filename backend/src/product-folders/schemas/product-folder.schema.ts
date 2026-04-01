import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductFolderDocument = HydratedDocument<ProductFolder>;

@Schema({ timestamps: true, collection: 'product_folders' })
export class ProductFolder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;
}

export const ProductFolderSchema = SchemaFactory.createForClass(ProductFolder);

ProductFolderSchema.index({ userId: 1, name: 1 }, { unique: true });
