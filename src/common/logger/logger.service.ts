import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { Request, Response } from 'express';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'client01-backend' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        // File transport for error logs
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        // File transport for request logs
        new winston.transports.File({
          filename: 'logs/requests.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Request logging methods
  logIncomingRequest(req: Request, context?: string) {
    const logData = {
      type: 'INCOMING_REQUEST',
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      headers: {
        'content-type': req.get('Content-Type'),
        authorization: req.get('Authorization') ? '[REDACTED]' : undefined,
      },
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString(),
    };

    this.logger.info('Incoming Request', { ...logData, context });
  }

  logOutgoingResponse(
    req: Request,
    res: Response,
    responseTime: number,
    context?: string,
  ) {
    const logData = {
      type: 'OUTGOING_RESPONSE',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString(),
    };

    const level = res.statusCode >= 400 ? 'error' : 'info';
    this.logger.log(level, 'Outgoing Response', { ...logData, context });
  }

  logRequestError(
    req: Request,
    error: Error,
    responseTime: number,
    context?: string,
  ) {
    const logData = {
      type: 'REQUEST_ERROR',
      method: req.method,
      url: req.url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Request Error', { ...logData, context });
  }
} 