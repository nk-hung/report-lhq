import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface WrappedResponse<T> {
    data: T;
    message: string;
    statusCode: number;
}
export declare class ResponseInterceptor<T> implements NestInterceptor<T, WrappedResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<WrappedResponse<T>>;
}
