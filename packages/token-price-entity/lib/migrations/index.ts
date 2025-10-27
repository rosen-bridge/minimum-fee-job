import { Migration1761572216212 } from './postgres/1761572216212-migration';
import { Migration1761572266734 } from './sqlite/1761572266734-migration';

export const migrations = {
  sqlite: [Migration1761572266734],
  postgres: [Migration1761572216212],
};
