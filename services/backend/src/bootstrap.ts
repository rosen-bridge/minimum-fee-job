import '@rosen-bridge/extended-typeorm/bootstrap';
import WinstonLogger from '@rosen-bridge/winston-logger';
import { logConfigs } from './configs';
import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

const winston = new WinstonLogger(logConfigs());
DefaultLoggerFactory.init(winston);
