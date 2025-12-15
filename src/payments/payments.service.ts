import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";
import { ProviderSwitcherService } from "src/payments/switcher.service";

@Injectable()
export class PaymentsService {

    constructor(
        private readonly providerSwitcher: ProviderSwitcherService,
    ) {}

  async processPayment(paymentDto: CreatePaymentDto) {
    return this.providerSwitcher.executeWithFallback(paymentDto);
  }
}
