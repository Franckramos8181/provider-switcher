import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";
// import { ProviderAService } from "src/providers/provider-a.service";
import { ProviderBService } from "src/providers/provider-b.service";
import { ProviderCService } from "src/providers/provider-c.service";

@Injectable()
export class PaymentsService {

    constructor(private readonly providerC: ProviderCService) {}

    async processPayment(paymentDto: CreatePaymentDto) {
        return this.providerC.processPayment(paymentDto);
    }
}
