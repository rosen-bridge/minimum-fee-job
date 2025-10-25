import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class Migration1738000000000 implements MigrationInterface {
  name = 'Migration1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_price_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "timestamp" integer NOT NULL,
                "ergoSideTokenId" varchar NOT NULL,
                "price" decimal NOT NULL
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_token_price_entity_timestamp" ON "token_price_entity" ("timestamp")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_token_price_entity_ergoSideTokenId" ON "token_price_entity" ("ergoSideTokenId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_token_price_entity_ergoSideTokenId"
        `);
    await queryRunner.query(`
            DROP INDEX "IDX_token_price_entity_timestamp"
        `);
    await queryRunner.query(`
            DROP TABLE "token_price_entity"
        `);
  }
}
