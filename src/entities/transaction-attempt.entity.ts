import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentProvider } from './payment-provider.entity';

@Entity('transaction_attempts')
export class TransactionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transactionId: string;

  @ManyToOne(() => PaymentTransaction, transaction => transaction.attempts)
  @JoinColumn({ name: 'transactionId', referencedColumnName: 'transactionId' })
  transaction: PaymentTransaction;

  @Column()
  providerId: string;

  @ManyToOne(() => PaymentProvider)
  @JoinColumn({ name: 'providerId' })
  provider: PaymentProvider;

  @Column({ type: 'integer' })
  attemptNumber: number;

  @Column({
    type: 'text',
    default: 'pending'
  })
  status: 'success' | 'failed' | 'timeout';

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  attemptedAt: Date;
}
