"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const import_record_schema_1 = require("../import/schemas/import-record.schema");
const import_session_schema_1 = require("../import/schemas/import-session.schema");
let ReportService = class ReportService {
    recordModel;
    sessionModel;
    constructor(recordModel, sessionModel) {
        this.recordModel = recordModel;
        this.sessionModel = sessionModel;
    }
    async getTotal(userId) {
        const result = await this.recordModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalCp: { $sum: '$cp' },
                    totalDt: { $sum: '$dt' },
                },
            },
        ]);
        const data = result[0] || { totalCp: 0, totalDt: 0 };
        return {
            totalCp: data.totalCp,
            totalDt: data.totalDt,
            totalProfit: data.totalDt - data.totalCp,
        };
    }
    async getExpend(userId) {
        const result = await this.recordModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
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
    async getRevenue(userId) {
        const result = await this.recordModel.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
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
    async getCompare(userId, sessionId) {
        const MAX_DAYS_PER_ROW = 10;
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        let currentSession;
        if (sessionId) {
            currentSession = await this.sessionModel
                .findOne({ _id: new mongoose_2.Types.ObjectId(sessionId), userId: userObjId })
                .lean();
        }
        if (!currentSession) {
            currentSession = await this.sessionModel
                .findOne({ userId: userObjId })
                .sort({ importOrder: -1 })
                .lean();
        }
        if (!currentSession) {
            return { records: [], total: 0, maxDays: 0, currentSessionId: null, prevSessionId: null, nextSessionId: null, oldestSessionId: null };
        }
        const [prevSession, nextSession, oldestSession] = await Promise.all([
            this.sessionModel
                .findOne({ userId: userObjId, importOrder: { $lt: currentSession.importOrder } })
                .sort({ importOrder: -1 })
                .lean(),
            this.sessionModel
                .findOne({ userId: userObjId, importOrder: { $gt: currentSession.importOrder } })
                .sort({ importOrder: 1 })
                .lean(),
            this.sessionModel
                .findOne({ userId: userObjId })
                .sort({ importOrder: 1 })
                .lean(),
        ]);
        const currentRecords = await this.recordModel
            .find({ sessionId: currentSession._id })
            .lean();
        const latestSubIds = [...new Set(currentRecords.map((r) => r.subId))];
        const totals = await this.recordModel.aggregate([
            { $match: { userId: userObjId, subId: { $in: latestSubIds }, importOrder: { $lte: currentSession.importOrder } } },
            {
                $group: {
                    _id: '$subId',
                    tcp: { $sum: '$cp' },
                    tdt: { $sum: '$dt' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const allRecords = await this.recordModel
            .find({ userId: userObjId, subId: { $in: latestSubIds }, importOrder: { $lte: currentSession.importOrder } })
            .sort({ importOrder: 1 })
            .lean();
        const recordsBySubId = new Map();
        for (const record of allRecords) {
            const list = recordsBySubId.get(record.subId) || [];
            list.push(record);
            recordsBySubId.set(record.subId, list);
        }
        const allRows = [];
        for (const t of totals) {
            const subRecords = recordsBySubId.get(t._id) || [];
            for (let chunk = 0; chunk < subRecords.length; chunk += MAX_DAYS_PER_ROW) {
                const chunkRecords = subRecords.slice(chunk, chunk + MAX_DAYS_PER_ROW);
                const days = chunkRecords.map((r, index) => ({
                    day: index + 1,
                    cp: r.cp,
                    dt: r.dt,
                    hq: r.cp > 0 ? Math.round((r.dt / r.cp) * 100 * 100) / 100 : 0,
                }));
                allRows.push({
                    subId: t._id,
                    tcp: t.tcp,
                    tdt: t.tdt,
                    tln: t.tdt - t.tcp,
                    days,
                });
            }
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
        const maxDays = Math.min(MAX_DAYS_PER_ROW, Math.max(...allRows.map((r) => r.days.length), 0));
        return {
            records: allRows,
            total: allRows.length,
            maxDays,
            currentSessionId: currentSession._id.toString(),
            prevSessionId: prevSession ? prevSession._id.toString() : null,
            nextSessionId: nextSession ? nextSession._id.toString() : null,
            oldestSessionId: oldestSession && oldestSession._id.toString() !== currentSession._id.toString() ? oldestSession._id.toString() : null,
        };
    }
    async resetData(userId) {
        const userObjId = new mongoose_2.Types.ObjectId(userId);
        await this.recordModel.deleteMany({ userId: userObjId });
        await this.sessionModel.deleteMany({ userId: userObjId });
        return { deleted: true };
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(import_record_schema_1.ImportRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(import_session_schema_1.ImportSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ReportService);
//# sourceMappingURL=report.service.js.map