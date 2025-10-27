import {
  MigrationInterface,
  QueryRunner,
} from '@rosen-bridge/extended-typeorm';

export class Migration1761572216212 implements MigrationInterface {
  name = 'Migration1761572216212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "token_price_entity" (
                "id" SERIAL NOT NULL,
                "timestamp" integer NOT NULL,
                "ergoSideTokenId" character varying NOT NULL,
                "price" double precision NOT NULL,
                CONSTRAINT "PK_a61101a1eb27676da13dfff4ab6" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "token_price_entity"
        `);
  }
}
