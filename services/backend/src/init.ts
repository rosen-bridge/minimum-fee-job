import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { dataSource } from '../config/dataSource';
import { exit } from 'process';
const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const init = async () => {
  try {
    logger.debug('Initializing data sources...');
    await dataSource.initialize();
    logger.debug('Data sources had been initialized.');
    await dataSource.runMigrations();
    logger.debug('Migrations done successfully.');
  } catch (err) {
    logger.error(`An error occurred while initializing datasource: ${err}`);
    exit(1);
  }
};
