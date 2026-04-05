import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
  joinColumn: 'sub_id1' | 'sub_id2';
}

interface AffiliateRow {
  subId1: string;
  subId2: string;
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

  private getShopeeJoinMetadata(campaignName: string): {
    subId: string;
    joinColumn: 'sub_id1' | 'sub_id2';
  } {
    const lastDashIdx = campaignName.lastIndexOf('-');
    const lastUnderscoreIdx = campaignName.lastIndexOf('_');
    const lastSeparatorIdx = Math.max(lastDashIdx, lastUnderscoreIdx);
    const usesAffiliateSubId2 = lastSeparatorIdx >= 0;
    const subId = (
      usesAffiliateSubId2
        ? campaignName.substring(lastSeparatorIdx + 1)
        : campaignName
    ).trim();

    return {
      subId,
      joinColumn: usesAffiliateSubId2 ? 'sub_id2' : 'sub_id1',
    };
  }

  /**
   * Get all import sessions for a user, sorted by importDate DESC.
   * Each session includes recordCount (number of ImportRecords).
   */
  async getSessions(userId: string) {
    const userObjId = new Types.ObjectId(userId);

    const sessions = await this.sessionModel
      .find({ userId: userObjId })
      .sort({ importDate: -1, importOrder: -1 })
      .lean();

    // Get record counts for all sessions in one aggregation
    const counts = await this.recordModel.aggregate([
      { $match: { userId: userObjId } },
      { $group: { _id: '$sessionId', recordCount: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const c of counts) {
      countMap.set(c._id.toString(), c.recordCount);
    }

    return sessions.map((s) => ({
      _id: s._id,
      importDate: s.importDate,
      importOrder: s.importOrder,
      recordCount: countMap.get(s._id.toString()) || 0,
    }));
  }

  /**
   * Delete a session and all its records.
   * Then recalculate importOrder for remaining sessions (sorted by importDate ASC).
   * Also update importOrder in corresponding ImportRecords.
   */
  async deleteSession(sessionId: string, userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const sessionObjId = new Types.ObjectId(sessionId);

    // Verify the session exists and belongs to the user
    const session = await this.sessionModel.findOne({
      _id: sessionObjId,
      userId: userObjId,
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Delete all records belonging to this session
    await this.recordModel.deleteMany({ sessionId: sessionObjId });

    // Delete the session itself
    await this.sessionModel.deleteOne({ _id: sessionObjId });

    // Recalculate importOrder for remaining sessions
    const remainingSessions = await this.sessionModel
      .find({ userId: userObjId })
      .sort({ importDate: 1, importOrder: 1 })
      .lean();

    for (let i = 0; i < remainingSessions.length; i++) {
      const newOrder = i + 1;
      const s = remainingSessions[i];

      if (s.importOrder !== newOrder) {
        await this.sessionModel.updateOne(
          { _id: s._id },
          { $set: { importOrder: newOrder } },
        );

        await this.recordModel.updateMany(
          { sessionId: s._id },
          { $set: { importOrder: newOrder } },
        );
      }
    }

    return { deleted: true };
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

    // Build affiliate lookup maps: DT = SUM(Tổng hoa hồng đơn hàng) GROUP BY Sub_id1 / Sub_id2
    const affiliateMapById1 = new Map<string, number>();
    const affiliateMapById2 = new Map<string, number>();
    for (const row of affiliateData) {
      if (row.subId1) {
        affiliateMapById1.set(
          row.subId1,
          (affiliateMapById1.get(row.subId1) || 0) + row.dt,
        );
      }
      if (row.subId2) {
        affiliateMapById2.set(
          row.subId2,
          (affiliateMapById2.get(row.subId2) || 0) + row.dt,
        );
      }
    }

    // Build shopee grouped map: CP = SUM(Số tiền đã chi tiêu) GROUP BY SubID
    const shopeeMap = new Map<
      string,
      { campaignName: string; cp: number; joinColumn: 'sub_id1' | 'sub_id2' }
    >();
    for (const row of shopeeData) {
      const existing = shopeeMap.get(row.subId);
      if (existing) {
        existing.cp += row.cp;
      } else {
        shopeeMap.set(row.subId, {
          campaignName: row.campaignName,
          cp: row.cp,
          joinColumn: row.joinColumn,
        });
      }
    }

    // Join Shopee & Affiliate: join column depends on campaign name format
    // - Campaign có dấu '-' hoặc '_': subId join với Sub_id2
    // - Campaign không có '-' và không có '_': subId join với Sub_id1
    const allSubIds = new Set([
      ...shopeeMap.keys(),
      ...affiliateMapById1.keys(),
      ...affiliateMapById2.keys(),
    ]);

    const records: any[] = [];
    for (const subId of allSubIds) {
      if (!subId) continue;
      const shopee = shopeeMap.get(subId);

      let dt = 0;
      if (shopee) {
        // Shopee row exists — use its joinColumn to pick the right affiliate map
        dt =
          shopee.joinColumn === 'sub_id1'
            ? affiliateMapById1.get(subId) || 0
            : affiliateMapById2.get(subId) || 0;
      } else {
        // No shopee row — check both affiliate maps, prefer sub_id2
        dt = affiliateMapById2.get(subId) || affiliateMapById1.get(subId) || 0;
        if (!dt) continue; // skip if no data from either side
      }

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
      (h) => typeof h === 'string' && h.trim().includes('Tên chiến dịch'),
    );
    let cpColIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' && h.trim().includes('Số tiền đã chi tiêu (VND)'),
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

      const { subId, joinColumn } = this.getShopeeJoinMetadata(campaignName);
      if (!subId) continue;

      results.push({
        subId,
        campaignName,
        cp: cpValue,
        joinColumn,
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

    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine);

    let campaignColIdx = headers.findIndex((h) =>
      h.trim().includes('Tên chiến dịch'),
    );
    let cpColIdx = headers.findIndex((h) =>
      h.trim().includes('Số tiền đã chi tiêu (VND)'),
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
      const rawCp = (fields[cpColIdx] || '0').replace(/[",\s]/g, '').trim();
      const cpValue = Number(rawCp) || 0;
      if (cpValue <= 0) continue;

      const campaignName = (fields[campaignColIdx] || '').trim();
      if (!campaignName) continue;

      const { subId, joinColumn } = this.getShopeeJoinMetadata(campaignName);
      if (!subId) continue;

      results.push({
        subId,
        campaignName,
        cp: cpValue,
        joinColumn,
      });
    }

    return results;
  }

  /**
   * Parse Affiliate data from an XLSX file.
   * Reads both "Sub_id1" and "Sub_id2" columns, plus "Tổng hoa hồng đơn hàng".
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

    const subId1Idx = headers.findIndex(
      (h) => typeof h === 'string' && h.trim() === 'Sub_id1',
    );
    const subId2Idx = headers.findIndex(
      (h) => typeof h === 'string' && h.trim() === 'Sub_id2',
    );
    const dtIdx = headers.findIndex(
      (h) =>
        typeof h === 'string' && h.trim().includes('Tổng hoa hồng đơn hàng'),
    );

    if (subId1Idx === -1 && subId2Idx === -1) {
      throw new BadRequestException(
        'XLSX file missing both Sub_id1 and Sub_id2 columns',
      );
    }
    if (dtIdx === -1) {
      throw new BadRequestException('XLSX file missing commission column');
    }

    const results: AffiliateRow[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row) continue;

      const subId1 = subId1Idx >= 0 ? String(row[subId1Idx] || '').trim() : '';
      const subId2 = subId2Idx >= 0 ? String(row[subId2Idx] || '').trim() : '';
      if (!subId1 && !subId2) continue;

      const dt = Number(row[dtIdx]) || 0;

      results.push({ subId1, subId2, dt });
    }

    return results;
  }

  /**
   * Parse Affiliate data from a CSV file.
   * Reads both "Sub_id1" and "Sub_id2" columns, plus "Tổng hoa hồng đơn hàng".
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

    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine);

    const subId1Idx = headers.findIndex((h) => h.trim() === 'Sub_id1');
    const subId2Idx = headers.findIndex((h) => h.trim() === 'Sub_id2');
    const dtIdx = headers.findIndex((h) =>
      h.trim().includes('Tổng hoa hồng đơn hàng'),
    );

    if (subId1Idx === -1 && subId2Idx === -1) {
      throw new BadRequestException(
        'CSV file missing both Sub_id1 and Sub_id2 columns',
      );
    }
    if (dtIdx === -1) {
      throw new BadRequestException('CSV file missing commission column');
    }

    const results: AffiliateRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;

      const fields = this.parseCsvLine(line);
      const subId1 = subId1Idx >= 0 ? (fields[subId1Idx] || '').trim() : '';
      const subId2 = subId2Idx >= 0 ? (fields[subId2Idx] || '').trim() : '';
      if (!subId1 && !subId2) continue;

      // Parse number: remove commas, quotes, spaces
      const rawDt = (fields[dtIdx] || '0').replace(/[",\s]/g, '').trim();
      const dt = Number(rawDt) || 0;

      results.push({ subId1, subId2, dt });
    }

    return results;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
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
