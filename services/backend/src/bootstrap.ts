import '@rosen-bridge/extended-typeorm/bootstrap';

import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

import { logConfigs } from './configs';

const winston = new WinstonLogger(logConfigs());
DefaultLoggerFactory.init(winston);
