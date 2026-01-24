import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class Migration1761572266734 implements MigrationInterface {
  name = 'Migration1761572266734';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_price_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "timestamp" integer NOT NULL,
                "tokenId" varchar NOT NULL,
                "price" float NOT NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "token_price_entity"
        `);
  }
}
