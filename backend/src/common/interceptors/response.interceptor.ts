import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WrappedResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  WrappedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WrappedResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(
      map((data) => ({
        data,
        message: 'Success',
        statusCode,
      })),
    );
  }
}
