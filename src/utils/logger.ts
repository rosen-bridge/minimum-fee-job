import path from 'path';
import winston, { format } from 'winston';
import 'winston-daily-rotate-file';

import { logLevel, logsPath, maxLogFilesCount, maxLogSize } from '@/configs';

import printf = format.printf;

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const logFormat = printf(
  ({ level, message, timestamp, fileName, ...context }) => {
    return `${timestamp} ${level}: [${fileName}] ${message}${
      context && Object.keys(context).length
        ? ` ${JSON.stringify(context)}`
        : ''
    }`;
  }
);

const logOptions = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: maxLogSize,
  maxFiles: maxLogFilesCount,
};

const logger = winston.createLogger({
  levels: logLevels,
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: logsPath + '%DATE%.log',
      ...logOptions,
      level: logLevel,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      level: logLevel,
    }),
  ],
  handleRejections: true,
  handleExceptions: true,
});

const loggerFactory = (filePath: string) =>
  logger.child({
    fileName: path.parse(filePath).name,
  });

export default loggerFactory;
