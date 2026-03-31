"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const XLSX = __importStar(require("xlsx"));
const import_session_schema_1 = require("./schemas/import-session.schema");
const import_record_schema_1 = require("./schemas/import-record.schema");
let ImportService = class ImportService {
    sessionModel;
    recordModel;
    constructor(sessionModel, recordModel) {
        this.sessionModel = sessionModel;
        this.recordModel = recordModel;
    }
    isExcelFile(file) {
        const name = (file.originalname || '').toLowerCase();
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            return true;
        }
        const mime = (file.mimetype || '').toLowerCase();
        return (mime ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mime === 'application/vnd.ms-excel');
    }
    async processUpload(shopeeFile, affiliateFile, importDateStr, userId) {
        if (!shopeeFile || !affiliateFile) {
            throw new common_1.BadRequestException('Both shopeeFile and affiliateFile are required');
        }
        const importDate = importDateStr ? new Date(importDateStr) : new Date();
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        const shopeeData = this.isExcelFile(shopeeFile)
            ? this.processXlsx(shopeeFile.buffer)
            : this.processShopeeFromCsv(shopeeFile.buffer);
        const affiliateData = this.isExcelFile(affiliateFile)
            ? this.processAffiliateFromXlsx(affiliateFile.buffer)
            : this.processCsv(affiliateFile.buffer);
        const existingCount = await this.sessionModel.countDocuments({
            userId: userObjId,
        });
        const importOrder = existingCount + 1;
        const session = new this.sessionModel({
            importDate,
            importOrder,
            userId: userObjId,
        });
        await session.save();
        const affiliateMap = new Map();
        for (const row of affiliateData) {
            affiliateMap.set(row.subId, (affiliateMap.get(row.subId) || 0) + row.dt);
        }
        const shopeeMap = new Map();
        for (const row of shopeeData) {
            const existing = shopeeMap.get(row.subId);
            if (existing) {
                existing.cp += row.cp;
            }
            else {
                shopeeMap.set(row.subId, {
                    campaignName: row.campaignName,
                    cp: row.cp,
                });
            }
        }
        const allSubIds = new Set([
            ...shopeeMap.keys(),
            ...affiliateMap.keys(),
        ]);
        const records = [];
        for (const subId of allSubIds) {
            if (!subId)
                continue;
            const shopee = shopeeMap.get(subId);
            const dt = affiliateMap.get(subId) || 0;
            const campaignName = shopee?.campaignName || subId;
            if (!campaignName)
                continue;
            records.push({
                sessionId: session._id,
                subId,
                campaignName,
                cp: shopee?.cp || 0,
                dt,
                importDate,
                importOrder,
                userId: userObjId,
            });
        }
        if (records.length > 0) {
            await this.recordModel.insertMany(records);
        }
        return {
            sessionId: session._id,
            importDate,
            importOrder,
            recordCount: records.length,
        };
    }
    processXlsx(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new common_1.BadRequestException('XLSX file has no sheets');
        }
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new common_1.BadRequestException('XLSX sheet is empty');
        }
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
        });
        if (jsonData.length < 2) {
            throw new common_1.BadRequestException('XLSX file has no data rows');
        }
        const headers = jsonData[0];
        let campaignColIdx = headers.findIndex((h) => typeof h === 'string' &&
            h.trim().includes('Tên chiến dịch'));
        let cpColIdx = headers.findIndex((h) => typeof h === 'string' &&
            h.trim().includes('Số tiền đã chi tiêu (VND)'));
        if (campaignColIdx === -1)
            campaignColIdx = 2;
        if (cpColIdx === -1)
            cpColIdx = 12;
        const results = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row)
                continue;
            const cpValue = Number(row[cpColIdx]) || 0;
            if (cpValue <= 0)
                continue;
            const campaignName = String(row[campaignColIdx] || '').trim();
            if (!campaignName)
                continue;
            const lastDashIdx = campaignName.lastIndexOf('-');
            const subId = (lastDashIdx >= 0
                ? campaignName.substring(lastDashIdx + 1)
                : campaignName).trim();
            if (!subId)
                continue;
            results.push({
                subId,
                campaignName,
                cp: cpValue,
            });
        }
        return results;
    }
    processShopeeFromCsv(buffer) {
        let content = buffer.toString('utf-8');
        if (content.charCodeAt(0) === 0xfeff) {
            content = content.substring(1);
        }
        const lines = content.split(/\r?\n/);
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV file has no data rows');
        }
        const headerLine = lines[0];
        const headers = this.parseCsvLine(headerLine);
        let campaignColIdx = headers.findIndex((h) => h.trim().includes('Tên chiến dịch'));
        let cpColIdx = headers.findIndex((h) => h.trim().includes('Số tiền đã chi tiêu (VND)'));
        if (campaignColIdx === -1)
            campaignColIdx = 2;
        if (cpColIdx === -1)
            cpColIdx = 12;
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.trim() === '')
                continue;
            const fields = this.parseCsvLine(line);
            const rawCp = (fields[cpColIdx] || '0')
                .replace(/[",\s]/g, '')
                .trim();
            const cpValue = Number(rawCp) || 0;
            if (cpValue <= 0)
                continue;
            const campaignName = (fields[campaignColIdx] || '').trim();
            if (!campaignName)
                continue;
            const lastDashIdx = campaignName.lastIndexOf('-');
            const subId = (lastDashIdx >= 0
                ? campaignName.substring(lastDashIdx + 1)
                : campaignName).trim();
            if (!subId)
                continue;
            results.push({
                subId,
                campaignName,
                cp: cpValue,
            });
        }
        return results;
    }
    processAffiliateFromXlsx(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new common_1.BadRequestException('XLSX file has no sheets');
        }
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new common_1.BadRequestException('XLSX sheet is empty');
        }
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
        });
        if (jsonData.length < 2) {
            throw new common_1.BadRequestException('XLSX file has no data rows');
        }
        const headers = jsonData[0];
        const subIdIdx = headers.findIndex((h) => typeof h === 'string' && h.trim() === 'Sub_id2');
        const dtIdx = headers.findIndex((h) => typeof h === 'string' &&
            h.trim().includes('Tổng hoa hồng đơn hàng'));
        if (subIdIdx === -1) {
            throw new common_1.BadRequestException('XLSX file missing Sub_id2 column');
        }
        if (dtIdx === -1) {
            throw new common_1.BadRequestException('XLSX file missing commission column');
        }
        const results = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row)
                continue;
            const subId = String(row[subIdIdx] || '').trim();
            if (!subId)
                continue;
            const dt = Number(row[dtIdx]) || 0;
            results.push({ subId, dt });
        }
        return results;
    }
    processCsv(buffer) {
        let content = buffer.toString('utf-8');
        if (content.charCodeAt(0) === 0xfeff) {
            content = content.substring(1);
        }
        const lines = content.split(/\r?\n/);
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV file has no data rows');
        }
        const headerLine = lines[0];
        const headers = this.parseCsvLine(headerLine);
        const subIdIdx = headers.findIndex((h) => h.trim() === 'Sub_id2');
        const dtIdx = headers.findIndex((h) => h.trim().includes('Tổng hoa hồng đơn hàng'));
        if (subIdIdx === -1) {
            throw new common_1.BadRequestException('CSV file missing Sub_id2 column');
        }
        if (dtIdx === -1) {
            throw new common_1.BadRequestException('CSV file missing commission column');
        }
        const results = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line.trim() === '')
                continue;
            const fields = this.parseCsvLine(line);
            const subId = (fields[subIdIdx] || '').trim();
            if (!subId)
                continue;
            const rawDt = (fields[dtIdx] || '0')
                .replace(/[",\s]/g, '')
                .trim();
            const dt = Number(rawDt) || 0;
            results.push({ subId, dt });
        }
        return results;
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (inQuotes) {
                if (char === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    }
                    else {
                        inQuotes = false;
                    }
                }
                else {
                    current += char;
                }
            }
            else {
                if (char === '"') {
                    inQuotes = true;
                }
                else if (char === ',') {
                    result.push(current);
                    current = '';
                }
                else {
                    current += char;
                }
            }
        }
        result.push(current);
        return result;
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(import_session_schema_1.ImportSession.name)),
    __param(1, (0, mongoose_1.InjectModel)(import_record_schema_1.ImportRecord.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ImportService);
//# sourceMappingURL=import.service.js.map