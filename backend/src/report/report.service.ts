import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ImportRecord,
  ImportRecordDocument,
} from '../import/schemas/import-record.schema';
import {
  ImportSession,
  ImportSessionDocument,
} from '../import/schemas/import-session.schema';

type ReportTotalAggregate = {
  _id: null;
  totalCp: number;
  totalDt: number;
};

type ExpendRow = {
  subId: string;
  campaignName: string;
  totalCp: number;
};

type RevenueRow = {
  subId: string;
  totalDt: number;
};

type CompareTotalsAggregate = {
  _id: string;
  tcp: number;
  tdt: number;
};

type CompareRecordSnapshot = Pick<ImportRecord, 'subId' | 'cp' | 'dt'>;

type CompareDay = {
  day: number;
  cp: number;
  dt: number;
  hq: number;
};

type CompareRow = {
  subId: string;
  tcp: number;
  tdt: number;
  tln: number;
  days: CompareDay[];
};

type SessionRef = {
  _id: Types.ObjectId;
  importOrder: number;
};

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(ImportRecord.name)
    private recordModel: Model<ImportRecordDocument>,
    @InjectModel(ImportSession.name)
    private sessionModel: Model<ImportSessionDocument>,
  ) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getTotal(userId: string) {
    const result = await this.recordModel.aggregate<ReportTotalAggregate>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalCp: { $sum: '$cp' },
          totalDt: { $sum: '$dt' },
        },
      },
    ]);

    const data: Omit<ReportTotalAggregate, '_id'> = result[0] ?? {
      totalCp: 0,
      totalDt: 0,
    };

    return {
      totalCp: data.totalCp,
      totalDt: data.totalDt,
      totalProfit: data.totalDt - data.totalCp,
    };
  }

  async getExpend(userId: string) {
    const result = await this.recordModel.aggregate<ExpendRow>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$subId',
          campaignName: { $first: '$campaignName' },
          totalCp: { $sum: '$cp' },
        },
      },
      { $sort: { totalCp: -1 } },
      {
        $project: {
          _id: 0,
          subId: '$_id',
          campaignName: 1,
          totalCp: 1,
        },
      },
    ]);

    return result;
  }

  async getRevenue(userId: string) {
    const result = await this.recordModel.aggregate<RevenueRow>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$subId',
          totalDt: { $sum: '$dt' },
        },
      },
      { $sort: { totalDt: -1 } },
      {
        $project: {
          _id: 0,
          subId: '$_id',
          totalDt: 1,
        },
      },
    ]);

    return result;
  }

  private async findCurrentSession(
    userObjId: Types.ObjectId,
    sessionId?: string,
  ): Promise<SessionRef | null> {
    if (sessionId && Types.ObjectId.isValid(sessionId)) {
      const session = await this.sessionModel
        .findOne({ _id: new Types.ObjectId(sessionId), userId: userObjId })
        .select('_id importOrder')
        .lean<SessionRef>();

      if (session) {
        return session;
      }
    }

    return this.sessionModel
      .findOne({ userId: userObjId })
      .select('_id importOrder')
      .sort({ importOrder: -1 })
      .lean<SessionRef>();
  }

  async getCompare(userId: string, sessionId?: string, campaignName?: string) {
    const MAX_DAYS_PER_ROW = 10;
    const userObjId = new Types.ObjectId(userId);
    const trimmedCampaignName = campaignName?.trim();

    // Find the target session: by sessionId or latest
    const currentSession = await this.findCurrentSession(userObjId, sessionId);

    if (!currentSession) {
      return {
        records: [],
        total: 0,
        maxDays: 0,
        currentSessionId: null,
        prevSessionId: null,
        nextSessionId: null,
        oldestSessionId: null,
      };
    }

    // Find prev (older), next (newer), and oldest sessions for navigation
    const [prevSession, nextSession, oldestSession] = await Promise.all([
      this.sessionModel
        .findOne({
          userId: userObjId,
          importOrder: { $lt: currentSession.importOrder },
        })
        .sort({ importOrder: -1 })
        .lean(),
      this.sessionModel
        .findOne({
          userId: userObjId,
          importOrder: { $gt: currentSession.importOrder },
        })
        .sort({ importOrder: 1 })
        .lean(),
      this.sessionModel
        .findOne({ userId: userObjId })
        .sort({ importOrder: 1 })
        .lean(),
    ]);

    // Get all subIds from the current import session
    const latestSubIds = await this.recordModel.distinct(
      'subId',
      trimmedCampaignName
        ? {
            userId: userObjId,
            sessionId: currentSession._id,
            campaignName: {
              $regex: this.escapeRegex(trimmedCampaignName),
              $options: 'i',
            },
          }
        : {
            userId: userObjId,
            sessionId: currentSession._id,
          },
    );

    if (latestSubIds.length === 0) {
      return {
        records: [],
        total: 0,
        maxDays: 0,
        currentSessionId: currentSession._id.toString(),
        prevSessionId: prevSession ? prevSession._id.toString() : null,
        nextSessionId: nextSession ? nextSession._id.toString() : null,
        oldestSessionId:
          oldestSession &&
          oldestSession._id.toString() !== currentSession._id.toString()
            ? oldestSession._id.toString()
            : null,
      };
    }

    // Get totals for these subIds up to and including the current session
    const totals = await this.recordModel.aggregate<CompareTotalsAggregate>([
      {
        $match: {
          userId: userObjId,
          subId: { $in: latestSubIds },
          importOrder: { $lte: currentSession.importOrder },
        },
      },
      {
        $group: {
          _id: '$subId',
          tcp: { $sum: '$cp' },
          tdt: { $sum: '$dt' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get records for these subIds up to and including the current session
    const allRecords = await this.recordModel
      .find({
        userId: userObjId,
        subId: { $in: latestSubIds },
        importOrder: { $lte: currentSession.importOrder },
      })
      .select('subId cp dt')
      .sort({ importOrder: -1, _id: -1 })
      .lean<CompareRecordSnapshot[]>();

    // Group records by subId
    const recordsBySubId = new Map<string, CompareRecordSnapshot[]>();
    for (const record of allRecords) {
      const list = recordsBySubId.get(record.subId) || [];
      list.push(record);
      recordsBySubId.set(record.subId, list);
    }

    // Build rows: split into chunks of MAX_DAYS_PER_ROW
    const allRows: CompareRow[] = [];
    for (const t of totals) {
      const subRecords = recordsBySubId.get(t._id) || [];

      // Split days into chunks of 10
      for (
        let chunk = 0;
        chunk < subRecords.length;
        chunk += MAX_DAYS_PER_ROW
      ) {
        const chunkRecords = subRecords.slice(chunk, chunk + MAX_DAYS_PER_ROW);
        const days = chunkRecords.map(
          (r, index): CompareDay => ({
            day: index + 1,
            cp: r.cp,
            dt: r.dt,
            hq: r.cp > 0 ? Math.round((r.dt / r.cp) * 100 * 100) / 100 : 0,
          }),
        );

        allRows.push({
          subId: t._id,
          tcp: t.tcp,
          tdt: t.tdt,
          tln: t.tdt - t.tcp,
          days,
        });
      }

      // If no records, still add one row
      if (subRecords.length === 0) {
        allRows.push({
          subId: t._id,
          tcp: t.tcp,
          tdt: t.tdt,
          tln: t.tdt - t.tcp,
          days: [],
        });
      }
    }

    const maxDays = Math.min(
      MAX_DAYS_PER_ROW,
      Math.max(...allRows.map((r) => r.days.length), 0),
    );

    return {
      records: allRows,
      total: allRows.length,
      maxDays,
      currentSessionId: currentSession._id.toString(),
      prevSessionId: prevSession ? prevSession._id.toString() : null,
      nextSessionId: nextSession ? nextSession._id.toString() : null,
      oldestSessionId:
        oldestSession &&
        oldestSession._id.toString() !== currentSession._id.toString()
          ? oldestSession._id.toString()
          : null,
    };
  }

  async resetData(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    await this.recordModel.deleteMany({ userId: userObjId });
    await this.sessionModel.deleteMany({ userId: userObjId });
    return { deleted: true };
  }
}
