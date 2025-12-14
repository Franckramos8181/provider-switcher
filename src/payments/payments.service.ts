import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";
import { ProviderAService } from "src/providers/provider-a.service";
import { ProviderBService } from "src/providers/provider-b.service";
import { ProviderCService } from "src/providers/provider-c.service";

@Injectable()
export class PaymentsService {

    constructor(
        private readonly providerA: ProviderAService,
        private readonly providerB: ProviderBService,
        private readonly providerC: ProviderCService,
    ) {}

  async processPayment(paymentDto: CreatePaymentDto) {
    try {
      return await this.providerA.processPayment(paymentDto);
    } catch (errorA) {
      console.log('Provider A failed, trying B...');
      
      try {
        return await this.providerB.processPayment(paymentDto);
      } catch (errorB) {
        console.log('Provider B failed, trying C...');
        
        try {
          return await this.providerC.processPayment(paymentDto);
        } catch (errorC) {
          throw new Error('All providers failed');
        }
      }
    }
  }
}