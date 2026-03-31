import { Model } from 'mongoose';
import { ImportRecordDocument } from '../import/schemas/import-record.schema';
import { ImportSessionDocument } from '../import/schemas/import-session.schema';
export declare class ReportService {
    private recordModel;
    private sessionModel;
    constructor(recordModel: Model<ImportRecordDocument>, sessionModel: Model<ImportSessionDocument>);
    getTotal(userId: string): Promise<{
        totalCp: any;
        totalDt: any;
        totalProfit: number;
    }>;
    getExpend(userId: string): Promise<any[]>;
    getRevenue(userId: string): Promise<any[]>;
    getCompare(userId: string, sessionId?: string): Promise<{
        records: any[];
        total: number;
        maxDays: number;
        currentSessionId: any;
        prevSessionId: string | null;
        nextSessionId: string | null;
        oldestSessionId: string | null;
    }>;
    resetData(userId: string): Promise<{
        deleted: boolean;
    }>;
}
