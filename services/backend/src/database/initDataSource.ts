import { exit } from 'node:process';

import { DefaultLoggerFactory } from '@rosen-bridge/abstract-logger';

import { dataSource } from './dataSource';

const logger = DefaultLoggerFactory.getInstance().getLogger(import.meta.url);

export const initDataSource = async () => {
  try {
    logger.debug('Initializing datasources...');
    await dataSource.initialize();
    logger.debug('Data sources has been initialized');
    await dataSource.runMigrations();
    logger.debug('Migrations are done successfully');
  } catch (err) {
    logger.error(`An error occurred while initializing datasource:`, {
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    exit(1);
  }
};
