import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as XLSX from 'xlsx';
import {
  ImportSession,
  ImportSessionDocument,
} from './schemas/import-session.schema';
import {
  ImportRecord,
  ImportRecordDocument,
} from './schemas/import-record.schema';

interface ShopeeRow {
  subId: string;
  campaignName: string;
  cp: number;
}

interface AffiliateRow {
  subId: string;
  dt: number;
}

@Injectable()
export class ImportService {
  constructor(
    @InjectModel(ImportSession.name)
    private sessionModel: Model<ImportSessionDocument>,
    @InjectModel(ImportRecord.name)
    private recordModel: Model<ImportRecordDocument>,
  ) {}

  /**
   * Detect whether a file is Excel (.xlsx/.xls) based on extension or mimetype.
   */
  private isExcelFile(file: Express.Multer.File): boolean {
    const name = (file.originalname || '').toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return true;
    }
    const mime = (file.mimetype || '').toLowerCase();
    return (
      mime ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel'
    );
  }

  async processUpload(
    shopeeFile: Express.Multer.File,
    affiliateFile: Express.Multer.File,
    importDateStr: string | undefined,
    userId: string,
  ) {
    if (!shopeeFile || !affiliateFile) {
      throw new BadRequestException(
        'Both shopeeFile and affiliateFile are required',
      );
    }

    const importDate = importDateStr ? new Date(importDateStr) : new Date();
    const userObjId = new Types.ObjectId(userId);

    // Auto-detect file type for shopeeFile
    const shopeeData = this.isExcelFile(shopeeFile)
      ? this.processXlsx(shopeeFile.buffer)
      : this.processShopeeFromCsv(shopeeFile.buffer);

    // Auto-detect file type for affiliateFile
    const affiliateData = this.isExcelFile(affiliateFile)
      ? this.processAffiliateFromXlsx(affiliateFile.buffer)
      : this.processCsv(affiliateFile.buffer);

    // Calculate importOrder: count existing sessions for this user + 1
    const existingCount = await this.sessionModel.countDocuments({
      userId: userObjId,
    });
    const importOrder = existingCount + 1;

    // Create new import session
    const session = new this.sessionModel({
      importDate,
      importOrder,
      userId: userObjId,
    });
    await session.save();

    // Build affiliate lookup map: DT = SUM(Tổng hoa hồng đơn hàng) GROUP BY Sub_id2
    const affiliateMap = new Map<string, number>();
    for (const row of affiliateData) {
      affiliateMap.set(
        row.subId,
        (affiliateMap.get(row.subId) || 0) + row.dt,
      );
    }

    // Build shopee grouped map: CP = SUM(Số tiền đã chi tiêu) GROUP BY SubID
    const shopeeMap = new Map<
      string,
      { campaignName: string; cp: number }
    >();
    for (const row of shopeeData) {
      const existing = shopeeMap.get(row.subId);
      if (existing) {
        existing.cp += row.cp;
      } else {
        shopeeMap.set(row.subId, {
          campaignName: row.campaignName,
          cp: row.cp,
        });
      }
    }

    // Join Shopee & Affiliate via SubID = Sub_id2
    const allSubIds = new Set([
      ...shopeeMap.keys(),
      ...affiliateMap.keys(),
    ]);

    const records: any[] = [];
    for (const subId of allSubIds) {
      if (!subId) continue;
      const shopee = shopeeMap.get(subId);
      const dt = affiliateMap.get(subId) || 0;
      const campaignName = shopee?.campaignName || subId;
      if (!campaignName) continue;
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

  /**
   * Parse Shopee data from an XLSX file.
   * Looks for "Tên chiến dịch" and "Số tiền đã chi tiêu (VND)" columns.
   */
  private processXlsx(buffer: Buffer): ShopeeRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('XLSX file has no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new BadRequestException('XLSX sheet is empty');
    }

    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
    });
    if (jsonData.length < 2) {
      throw new BadRequestException('XLSX file has no data rows');
    }

    // Headers are in row 0
    const headers = jsonData[0] as string[];

    // Find column indices by header name
    let campaignColIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' &&
        h.trim().includes('Tên chiến dịch'),
    );
    let cpColIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' &&
        h.trim().includes('Số tiền đã chi tiêu (VND)'),
    );

    // Fallback to fixed indices if header names not found
    if (campaignColIdx === -1) campaignColIdx = 2;
    if (cpColIdx === -1) cpColIdx = 12;

    const results: ShopeeRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const cpValue = Number(row[cpColIdx]) || 0;
      if (cpValue <= 0) continue;

      const campaignName = String(row[campaignColIdx] || '').trim();
      if (!campaignName) continue;

      const lastDashIdx = campaignName.lastIndexOf('-');
      const subId = (
        lastDashIdx >= 0
          ? campaignName.substring(lastDashIdx + 1)
          : campaignName
      ).trim();
      if (!subId) continue;

      results.push({
        subId,
        campaignName,
        cp: cpValue,
      });
    }

    return results;
  }

  /**
   * Parse Shopee data from a CSV file.
   * Same column logic as processXlsx: "Tên chiến dịch" and "Số tiền đã chi tiêu (VND)".
   */
  private processShopeeFromCsv(buffer: Buffer): ShopeeRow[] {
    let content = buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.substring(1);
    }

    const lines = content.split(/\r?\n/);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file has no data rows');
    }

    const headerLine = lines[0]!;
    const headers = this.parseCsvLine(headerLine);

    let campaignColIdx = headers.findIndex(
      (h) => h.trim().includes('Tên chiến dịch'),
    );
    let cpColIdx = headers.findIndex(
      (h) => h.trim().includes('Số tiền đã chi tiêu (VND)'),
    );

    // Fallback to fixed indices if header names not found
    if (campaignColIdx === -1) campaignColIdx = 2;
    if (cpColIdx === -1) cpColIdx = 12;

    const results: ShopeeRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;

      const fields = this.parseCsvLine(line);

      // Parse CP: remove commas, quotes, spaces
      const rawCp = (fields[cpColIdx] || '0')
        .replace(/[",\s]/g, '')
        .trim();
      const cpValue = Number(rawCp) || 0;
      if (cpValue <= 0) continue;

      const campaignName = (fields[campaignColIdx] || '').trim();
      if (!campaignName) continue;

      const lastDashIdx = campaignName.lastIndexOf('-');
      const subId = (
        lastDashIdx >= 0
          ? campaignName.substring(lastDashIdx + 1)
          : campaignName
      ).trim();
      if (!subId) continue;

      results.push({
        subId,
        campaignName,
        cp: cpValue,
      });
    }

    return results;
  }

  /**
   * Parse Affiliate data from an XLSX file.
   * Same column logic as processCsv: "Sub_id2" and "Tổng hoa hồng đơn hàng".
   */
  private processAffiliateFromXlsx(buffer: Buffer): AffiliateRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('XLSX file has no sheets');
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new BadRequestException('XLSX sheet is empty');
    }

    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
    });
    if (jsonData.length < 2) {
      throw new BadRequestException('XLSX file has no data rows');
    }

    const headers = jsonData[0] as string[];

    const subIdIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' && h.trim() === 'Sub_id2',
    );
    const dtIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' &&
        h.trim().includes('Tổng hoa hồng đơn hàng'),
    );

    if (subIdIdx === -1) {
      throw new BadRequestException(
        'XLSX file missing Sub_id2 column',
      );
    }
    if (dtIdx === -1) {
      throw new BadRequestException(
        'XLSX file missing commission column',
      );
    }

    const results: AffiliateRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const subId = String(row[subIdIdx] || '').trim();
      if (!subId) continue;

      const dt = Number(row[dtIdx]) || 0;

      results.push({ subId, dt });
    }

    return results;
  }

  /**
   * Parse Affiliate data from a CSV file.
   * Looks for "Sub_id2" and "Tổng hoa hồng đơn hàng" columns.
   */
  private processCsv(buffer: Buffer): AffiliateRow[] {
    // Handle BOM
    let content = buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.substring(1);
    }

    const lines = content.split(/\r?\n/);
    if (lines.length < 2) {
      throw new BadRequestException('CSV file has no data rows');
    }

    const headerLine = lines[0]!;
    const headers = this.parseCsvLine(headerLine);

    const subIdIdx = headers.findIndex(
      (h) => h.trim() === 'Sub_id2',
    );
    const dtIdx = headers.findIndex((h) =>
      h.trim().includes('Tổng hoa hồng đơn hàng'),
    );

    if (subIdIdx === -1) {
      throw new BadRequestException(
        'CSV file missing Sub_id2 column',
      );
    }
    if (dtIdx === -1) {
      throw new BadRequestException(
        'CSV file missing commission column',
      );
    }

    const results: AffiliateRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;

      const fields = this.parseCsvLine(line);
      const subId = (fields[subIdIdx] || '').trim();
      if (!subId) continue;

      // Parse number: remove commas, quotes, spaces
      const rawDt = (fields[dtIdx] || '0')
        .replace(/[",\s]/g, '')
        .trim();
      const dt = Number(rawDt) || 0;

      results.push({ subId, dt });
    }

    return results;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    result.push(current);
    return result;
  }
}
