import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AuthModule } from './auth/auth.module';
import { ImportModule } from './import/import.module';
import { ReportModule } from './report/report.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { SavedProductsModule } from './saved-products/saved-products.module';
import { ProductFoldersModule } from './product-folders/product-folders.module';

const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb://mongoadmin:secret@localhost:27017/camp-report?authSource=admin';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    AuthModule,
    ImportModule,
    ReportModule,
    UserPreferencesModule,
    SavedProductsModule,
    ProductFoldersModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }

  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    if (this.connection.readyState === 1) {
      this.logger.log('MongoDB connected successfully');
    } else {
      this.logger.error('MongoDB connection failed');
    }
  }
}
