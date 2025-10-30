import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';
import { dataSource } from './dataSource';
import { exit } from 'node:process';
const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const initDataSource = async () => {
  try {
    logger.debug('Initializing data sources...');
    await dataSource.initialize();
    logger.debug('Data sources had been initialized.');
    await dataSource.runMigrations();
    logger.debug('Migrations done successfully.');
  } catch (err) {
    logger.error(`An error occurred while initializing datasource:`, {
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    exit(1);
  }
};
