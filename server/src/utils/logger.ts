import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'node:crypto';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'password',
      'password_hash',
      'token',
      'jwt',
      'secret',
      'two_factor_secret',
      'two_factor_backup_codes',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    return (req.headers['x-request-id'] as string) || crypto.randomUUID();
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => {
      // Don't clutter logs with static asset queries or health checks
      const url = req.url || '';
      return (
        url.startsWith('/assets') ||
        url.startsWith('/favicon') ||
        url.endsWith('.png') ||
        url.endsWith('.jpg') ||
        url.endsWith('.svg') ||
        url.endsWith('.css') ||
        url.endsWith('.js')
      );
    },
  },
});

