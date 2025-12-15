import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentProvider } from './payment-provider.entity';

@Entity('provider_health_checks')
export class ProviderHealthCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @ManyToOne(() => PaymentProvider)
  @JoinColumn({ name: 'providerId' })
  provider: PaymentProvider;

  @Column({
    type: 'text'
  })
  status: 'healthy' | 'down';

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  checkedAt: Date;
}
