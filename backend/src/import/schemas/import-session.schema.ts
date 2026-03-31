import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ImportSessionDocument = HydratedDocument<ImportSession>;

@Schema({ timestamps: true })
export class ImportSession {
  @Prop({ required: true })
  importDate!: Date;

  @Prop({ required: true, default: 1 })
  importOrder!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const ImportSessionSchema =
  SchemaFactory.createForClass(ImportSession);
