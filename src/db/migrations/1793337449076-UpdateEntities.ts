import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntities1793337449076 implements MigrationInterface {
    name = 'UpdateEntities1793337449076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "idempotency_keys" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "transfers" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "updated_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "transfers" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "idempotency_keys" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

}
