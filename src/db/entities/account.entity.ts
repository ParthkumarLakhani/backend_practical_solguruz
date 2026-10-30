import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { bigintTransformer } from '../../utils/transformers';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_name', type: 'varchar'})
  ownerName!: string;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'bigint', transformer: bigintTransformer, default: 0 })
  balance!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  
}