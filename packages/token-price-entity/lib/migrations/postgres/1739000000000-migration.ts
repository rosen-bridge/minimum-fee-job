import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class Migration1739000000000 implements MigrationInterface {
  name = 'Migration1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_price_entity" (
                "id" SERIAL NOT NULL,
                "timestamp" BIGINT NOT NULL,
                "ergoSideTokenId" character varying NOT NULL,
                "price" decimal(20,10) NOT NULL,
                CONSTRAINT "PK_token_price_entity_id" PRIMARY KEY ("id")
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
