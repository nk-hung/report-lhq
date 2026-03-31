import { ImportService } from './import.service';
import { UploadImportDto } from './dto/upload-import.dto';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    upload(files: {
        shopeeFile?: Express.Multer.File[];
        affiliateFile?: Express.Multer.File[];
    }, dto: UploadImportDto, req: any): Promise<{
        sessionId: import("mongoose").Types.ObjectId;
        importDate: Date;
        importOrder: number;
        recordCount: number;
    }>;
}
