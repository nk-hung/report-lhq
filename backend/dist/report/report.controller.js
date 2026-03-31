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
exports.ResetController = exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const report_service_1 = require("./report.service");
let ReportController = class ReportController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    async getTotal(req) {
        return this.reportService.getTotal(req.user.userId);
    }
    async getExpend(req) {
        return this.reportService.getExpend(req.user.userId);
    }
    async getRevenue(req) {
        return this.reportService.getRevenue(req.user.userId);
    }
    async getCompare(req, sessionId) {
        return this.reportService.getCompare(req.user.userId, sessionId);
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)('total'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get cumulative totals of CP and DT across all imports',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getTotal", null);
__decorate([
    (0, common_1.Get)('expend'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get expenditure breakdown from xlsx data grouped by subId',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getExpend", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get revenue breakdown from csv data grouped by subId',
    }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('compare'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get comparison report with TCP, TDT, TLN and daily breakdown. Use sessionId to paginate between import sessions.',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getCompare", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('Report'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('report'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
let ResetController = class ResetController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    async reset(req) {
        return this.reportService.resetData(req.user.userId);
    }
};
exports.ResetController = ResetController;
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete all data for the logged-in user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ResetController.prototype, "reset", null);
exports.ResetController = ResetController = __decorate([
    (0, swagger_1.ApiTags)('Reset'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reset'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ResetController);
//# sourceMappingURL=report.controller.js.map