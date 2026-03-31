import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import {
  ImportSession,
  ImportSessionSchema,
} from './schemas/import-session.schema';
import {
  ImportRecord,
  ImportRecordSchema,
} from './schemas/import-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImportSession.name, schema: ImportSessionSchema },
      { name: ImportRecord.name, schema: ImportRecordSchema },
    ]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
