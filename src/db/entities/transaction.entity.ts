import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { Transfer } from './transfer.entity';
import { bigintTransformer } from '../../utils/transformers';

export type TransactionType = 'CREDIT' | 'DEBIT';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: TransactionType;

  @Column({ type: 'bigint', transformer: bigintTransformer})
  amount!: number;

  @Column({ name: 'balance_after', type: 'bigint', transformer: bigintTransformer })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference!: string;

  @Column({ name: 'transfer_id', type: 'uuid', nullable: true })
  transferId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Account, {
    nullable: false,
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "account_id" })
  account!: Account;

  @ManyToOne(() => Transfer, {
    nullable: true,
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "transfer_id" })
  transfer!: Transfer | null;
}