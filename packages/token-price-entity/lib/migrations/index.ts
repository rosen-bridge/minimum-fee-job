import { Migration1739000000000 } from './postgres/1739000000000-migration';
import { Migration1738000000000 } from './sqlite/1738000000000-migration';

export const migrations = {
  sqlite: [Migration1738000000000],
  postgres: [Migration1739000000000],
};
