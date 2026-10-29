import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_name', type: 'varchar'})
  ownerName!: string;

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'bigint', default: 0 })
  balance!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @CreateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}