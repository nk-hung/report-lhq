import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportService } from './report.service';
import { ReportController, ResetController } from './report.controller';
import {
  ImportRecord,
  ImportRecordSchema,
} from '../import/schemas/import-record.schema';
import {
  ImportSession,
  ImportSessionSchema,
} from '../import/schemas/import-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImportRecord.name, schema: ImportRecordSchema },
      { name: ImportSession.name, schema: ImportSessionSchema },
    ]),
  ],
  controllers: [ReportController, ResetController],
  providers: [ReportService],
})
export class ReportModule {}
