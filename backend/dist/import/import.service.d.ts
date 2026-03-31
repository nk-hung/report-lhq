import { Model, Types } from 'mongoose';
import { ImportSessionDocument } from './schemas/import-session.schema';
import { ImportRecordDocument } from './schemas/import-record.schema';
export declare class ImportService {
    private sessionModel;
    private recordModel;
    constructor(sessionModel: Model<ImportSessionDocument>, recordModel: Model<ImportRecordDocument>);
    private isExcelFile;
    processUpload(shopeeFile: Express.Multer.File, affiliateFile: Express.Multer.File, importDateStr: string | undefined, userId: string): Promise<{
        sessionId: Types.ObjectId;
        importDate: Date;
        importOrder: number;
        recordCount: number;
    }>;
    private processXlsx;
    private processShopeeFromCsv;
    private processAffiliateFromXlsx;
    private processCsv;
    private parseCsvLine;
}
