import WinstonLogger from '@rosen-bridge/winston-logger';
import { logConfigs } from './configs';

WinstonLogger.init(logConfigs());
