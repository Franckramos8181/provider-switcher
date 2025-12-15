import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionAttempt } from './transaction-attempt.entity';
import { PaymentProvider } from './payment-provider.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transactionId: string;

  @Column({ nullable: true, unique: true })
  idempotencyKey?: string;

  @Column()
  customerId: string;

  @Column()
  customerEmail: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({
    type: 'text',
    default: 'pending'
  })
  status: 'success' | 'failed' | 'pending';

  @Column({ nullable: true })
  finalProviderId?: string;

  @ManyToOne(() => PaymentProvider, { nullable: true })
  @JoinColumn({ name: 'finalProviderId' })
  finalProvider?: PaymentProvider;

  @Column({ type: 'integer', default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @OneToMany(() => TransactionAttempt, attempt => attempt.transaction)
  attempts: TransactionAttempt[];
}
