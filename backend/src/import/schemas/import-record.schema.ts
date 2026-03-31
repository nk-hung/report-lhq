import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ImportRecordDocument = HydratedDocument<ImportRecord>;

@Schema({ timestamps: true })
export class ImportRecord {
  @Prop({ type: Types.ObjectId, ref: 'ImportSession', required: true })
  sessionId!: Types.ObjectId;

  @Prop({ required: true })
  subId!: string;

  @Prop({ required: true })
  campaignName!: string;

  @Prop({ required: true, default: 0 })
  cp!: number;

  @Prop({ required: true, default: 0 })
  dt!: number;

  @Prop({ required: true })
  importDate!: Date;

  @Prop({ required: true, default: 1 })
  importOrder!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const ImportRecordSchema =
  SchemaFactory.createForClass(ImportRecord);
