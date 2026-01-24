import config from 'config';

import { DataSource } from '@rosen-bridge/extended-typeorm';
import { TokenPriceEntity, migrations } from '@rosen-bridge/token-price-entity';

const dbType = config.get<string>('database.type') as keyof typeof migrations;
const dbConfigs = {
  entities: [TokenPriceEntity],
  migrations: [...migrations[dbType]],
  synchronize: false,
  logging: false,
};
let dataSource: DataSource;
if (dbType === 'sqlite') {
  dataSource = new DataSource({
    type: 'sqlite',
    database: config.get<string>('database.path'),
    ...dbConfigs,
  });
} else {
  dataSource = new DataSource({
    type: 'postgres',
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    ssl: config.get<boolean>('database.ssl'),
    username: config.get<string>('database.user'),
    password: config.get<string>('database.password'),
    database: config.get<string>('database.name'),
    ...dbConfigs,
  });
}

export { dataSource };
