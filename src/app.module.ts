import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { DatabaseModule } from './database/database.module';
import { CustomLogger } from './common/logger/custom-logger.service';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { TransactionAttempt } from './entities/transaction-attempt.entity';
import { PaymentProvider } from './entities/payment-provider.entity';
import { ProviderHealthCheck } from './entities/provider-health-check.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DATABASE_PATH', 'database/data.sqlite'),
        entities: [
          PaymentTransaction,
          TransactionAttempt,
          PaymentProvider,
          ProviderHealthCheck,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CustomLogger],
  exports: [CustomLogger],
})
export class AppModule {}
