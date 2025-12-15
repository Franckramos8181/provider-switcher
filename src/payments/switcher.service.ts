import { Injectable } from '@nestjs/common';
import { CreatePaymentDto, PaymentResponseDto } from 'src/common/dto/payment.dto';
import { ProviderAService } from 'src/providers/provider-a.service';
import { ProviderBService } from 'src/providers/provider-b.service';
import { ProviderCService } from 'src/providers/provider-c.service';
import { ProviderHandler } from './chain/provider-handler';

@Injectable()
export class ProviderSwitcherService {
  private chain: ProviderHandler;

  constructor(
    providerA: ProviderAService,
    providerB: ProviderBService,
    providerC: ProviderCService,
  ) {
    const handlerA = new ProviderHandler(providerA);
    const handlerB = new ProviderHandler(providerB);
    const handlerC = new ProviderHandler(providerC);

    handlerA.setNext(handlerB).setNext(handlerC);

    this.chain = handlerA
  }

  async executeWithFallback(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.chain.handle(payment);
  }
}
