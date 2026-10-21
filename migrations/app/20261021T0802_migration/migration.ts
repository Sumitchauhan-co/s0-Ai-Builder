#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/55a264d24143e84a53f466985984a3b6d4035b67ff42525d09d0787210788088/contract';
import startContract from '../../snapshots/55a264d24143e84a53f466985984a3b6d4035b67ff42525d09d0787210788088/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6f0b150f6c95b5933cb8e80c03208ab3161c6a0399c00056a9673cf1454e9deb/contract';
import endContract from '../../snapshots/6f0b150f6c95b5933cb8e80c03208ab3161c6a0399c00056a9673cf1454e9deb/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Fragment',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('files', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('messageId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sandboxUrl', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Message',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('projectId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('Message_role_check_e8086ca8', sql`"role" IN ('USER', 'ASSISTANT')`),
          checkExpression('Message_type_check_ed88b18f', sql`"type" IN ('RESULT', 'ERROR')`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Fragment',
        constraint: 'Fragment_messageId_key',
        columns: ['messageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Message',
        index: 'Message_projectId_idx_a96e4d92',
        columns: ['projectId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Fragment',
        foreignKey: {
          name: 'Fragment_messageId_fkey',
          columns: ['messageId'],
          references: { schema: 'public', table: 'Message', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Message',
        foreignKey: {
          name: 'Message_projectId_fkey',
          columns: ['projectId'],
          references: { schema: 'public', table: 'Project', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
