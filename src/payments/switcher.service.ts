import { Injectable } from '@nestjs/common';
import { CreatePaymentDto, PaymentResponseDto } from 'src/common/dto/payment.dto';
import { ProviderAService } from 'src/providers/provider-a.service';
import { ProviderBService } from 'src/providers/provider-b.service';
import { ProviderCService } from 'src/providers/provider-c.service';
import { ProviderHandler } from './chain/provider-handler';
import { CustomLogger } from 'src/common/logger/custom-logger.service';

@Injectable()
export class ProviderSwitcherService {
  private chain: ProviderHandler;

  constructor(
    providerA: ProviderAService,
    providerB: ProviderBService,
    providerC: ProviderCService,
    private readonly logger: CustomLogger,
  ) {
    const handlerA = new ProviderHandler(providerA, logger);
    const handlerB = new ProviderHandler(providerB, logger);
    const handlerC = new ProviderHandler(providerC, logger);

    handlerA.setNext(handlerB).setNext(handlerC);

    this.chain = handlerA;
  }

  async executeWithFallback(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
    this.logger.log('Starting payment chain execution');
    
    return this.chain.handle(payment);
  }
}
