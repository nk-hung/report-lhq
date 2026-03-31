import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getTotal(req: any): Promise<{
        totalCp: any;
        totalDt: any;
        totalProfit: number;
    }>;
    getExpend(req: any): Promise<any[]>;
    getRevenue(req: any): Promise<any[]>;
    getCompare(req: any, sessionId?: string): Promise<{
        records: any[];
        total: number;
        maxDays: number;
        currentSessionId: any;
        prevSessionId: string | null;
        nextSessionId: string | null;
        oldestSessionId: string | null;
    }>;
}
export declare class ResetController {
    private readonly reportService;
    constructor(reportService: ReportService);
    reset(req: any): Promise<{
        deleted: boolean;
    }>;
}
