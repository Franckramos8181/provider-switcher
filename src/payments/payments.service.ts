import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";
import { ProviderSwitcherService } from "src/payments/switcher.service";
import { CustomLogger } from "src/common/logger/custom-logger.service";

@Injectable()
export class PaymentsService {

    constructor(
        private readonly providerSwitcher: ProviderSwitcherService,
        private readonly logger: CustomLogger,
    ) {}

  async processPayment(paymentDto: CreatePaymentDto) {
    this.logger.debug('Starting payment processing');
    
    return this.providerSwitcher.executeWithFallback(paymentDto);
  }
}
