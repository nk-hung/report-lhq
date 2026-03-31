import { MiddlewareConsumer, NestModule, OnModuleInit } from '@nestjs/common';
import { Connection } from 'mongoose';
export declare class AppModule implements NestModule, OnModuleInit {
    private readonly connection;
    configure(consumer: MiddlewareConsumer): void;
    private readonly logger;
    constructor(connection: Connection);
    onModuleInit(): void;
}
