import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records the source IP a device last used to reach the console so the device
 * list can display "last connection IP" without joining the audit tables.
 */
export class AddPeerLastIp1792000000000 implements MigrationInterface {
  name = 'AddPeerLastIp1792000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('peers'))) {
      return;
    }

    const type = queryRunner.connection.options.type;

    if (type === 'sqlite') {
      if (!(await queryRunner.hasColumn('peers', 'lastIp')))
        await queryRunner.query(
          'ALTER TABLE "peers" ADD "lastIp" varchar(45)',
        );
      return;
    }

    if (type === 'mysql') {
      if (!(await queryRunner.hasColumn('peers', 'lastIp')))
        await queryRunner.query(
          'ALTER TABLE `peers` ADD `lastIp` varchar(45) NULL',
        );
      return;
    }

    throw new Error(`Unsupported database type: ${type}`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('peers'))) {
      return;
    }
    if (await queryRunner.hasColumn('peers', 'lastIp'))
      await queryRunner.dropColumn('peers', 'lastIp');
  }
}
