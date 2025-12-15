import { Injectable } from '@nestjs/common';
import { CreatePaymentDto, PaymentResponseDto } from 'src/common/dto/payment.dto';
import { IPaymentProvider } from 'src/common/interfaces/payment-provider.interface';
import { ProviderAService } from 'src/providers/provider-a.service';
import { ProviderBService } from 'src/providers/provider-b.service';
import { ProviderCService } from 'src/providers/provider-c.service';

@Injectable()
export class ProviderSwitcherService {
  private providers: IPaymentProvider[];

  constructor(
    providerA: ProviderAService,
    providerB: ProviderBService,
    providerC: ProviderCService,
  ) {
    // Prioritized
    this.providers = [providerA, providerB, providerC];
  }

  async executeWithFallback(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
    let lastError: Error | undefined;

    for (const provider of this.providers) {
      try {
        console.log(`Trying ${provider.getName()}...`);
        return await provider.processPayment(payment);
      } catch (error) {
        console.log(`${provider.getName()} failed: ${error.message}`);
        lastError = error;
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }
}
