import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ProvidersModule } from 'src/providers/providers.module';
import { ProviderSwitcherService } from './switcher.service';
import { CustomLogger } from 'src/common/logger/custom-logger.service';

@Module({
  imports: [ProvidersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, ProviderSwitcherService, CustomLogger],
})
export class PaymentsModule {}
