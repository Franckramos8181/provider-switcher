import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";
import { ProviderAService } from "src/providers/provider-a.service";

@Injectable()
export class PaymentsService {

    constructor(private readonly providerA: ProviderAService) {}

    async processPayment(paymentDto: CreatePaymentDto) {
        return this.providerA.processPayment(paymentDto);
    }
}
