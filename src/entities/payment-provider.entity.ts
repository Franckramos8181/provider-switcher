import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_providers')
export class PaymentProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'integer' })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  isHealthy: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastHealthCheck?: Date;

  @Column({ type: 'integer', default: 0 })
  consecutiveFailures: number;

  @Column({ type: 'integer', default: 0 })
  consecutiveSuccessChecks: number;

  @Column({ type: 'datetime', nullable: true })
  markedUnhealthyAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  recoveredAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
