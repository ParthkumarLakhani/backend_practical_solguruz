import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Account } from './account.entity';
import { bigintTransformer } from '../../utils/transformers';

@Entity({ name: 'transfers' })
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'from_account_id', type: 'uuid' })
  fromAccountId!: string;

  @Column({ name: 'to_account_id', type: 'uuid' })
  toAccountId!: string;

  @Column({ type: 'bigint', transformer: bigintTransformer  })
  amount!: number;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'varchar', nullable: true })
  reference!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Account, {
    nullable: false,
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "from_account_id" })
  fromAccount!: Account;

  @ManyToOne(() => Account, {
    nullable: false,
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "to_account_id" })
  toAccount!: Account;
}