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
var AppModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const core_1 = require("@nestjs/core");
const mongoose_2 = require("@nestjs/mongoose");
const mongoose_3 = require("mongoose");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const request_logger_middleware_1 = require("./common/middleware/request-logger.middleware");
const auth_module_1 = require("./auth/auth.module");
const import_module_1 = require("./import/import.module");
const report_module_1 = require("./report/report.module");
let AppModule = AppModule_1 = class AppModule {
    connection;
    configure(consumer) {
        consumer.apply(request_logger_middleware_1.RequestLoggerMiddleware).forRoutes('*');
    }
    logger = new common_1.Logger(AppModule_1.name);
    constructor(connection) {
        this.connection = connection;
    }
    onModuleInit() {
        if (this.connection.readyState === 1) {
            this.logger.log('MongoDB connected successfully');
        }
        else {
            this.logger.error('MongoDB connection failed');
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = AppModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot('mongodb://mongoadmin:secret@localhost:27017/camp-report?authSource=admin'),
            auth_module_1.AuthModule,
            import_module_1.ImportModule,
            report_module_1.ReportModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_interceptor_1.ResponseInterceptor,
            },
        ],
    }),
    __param(0, (0, mongoose_2.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_3.Connection])
], AppModule);
//# sourceMappingURL=app.module.js.map