import '@rosen-bridge/extended-typeorm/bootstrap';

import { DefaultLogger } from '@rosen-bridge/abstract-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';

import { logConfigs } from './configs';

const winston = WinstonLogger.createLogger(logConfigs());
DefaultLogger.init(winston);
