import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Response } from 'express';

interface FormattedResponse {
  statusCode: number;
  data: unknown;
  error: string[] | null;
  message: string[];
}

export default class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<FormattedResponse> {
    return next.handle().pipe(
      map((data: unknown): FormattedResponse => {
        const response = data as {
          statusCode?: number;
          message?: string | string[];
          data?: unknown;
        };

        if (
          response &&
          response.statusCode &&
          response.message &&
          (response.data !== undefined || response.data === null)
        ) {
          context.switchToHttp().getResponse<Response>().status(response.statusCode);
          return {
            statusCode: response.statusCode,
            data: response.data,
            error: null,
            message: Array.isArray(response.message) ? response.message : [response.message],
          };
        }

        return {
          statusCode: context.switchToHttp().getResponse<Response>().statusCode,
          data: JSON.parse(JSON.stringify(data)) as unknown,
          error: null,
          message: ['Success'],
        };
      }),
    );
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = [res];
      } else if (typeof res === 'object' && res !== null) {
        const responseObj = res as { message?: string | string[] };
        if (responseObj.message) {
          message = Array.isArray(responseObj.message)
            ? responseObj.message
            : [responseObj.message];
        } else {
          message = [JSON.stringify(res)];
        }
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const driverError = exception.driverError as { detail?: string };
      message = [driverError?.detail || exception.message];
    } else if (exception instanceof Error) {
      message = [exception.message];
    }

    response.status(status).json({
      statusCode: status,
      data: null,
      error: message,
      message: [],
    });
  }
}
