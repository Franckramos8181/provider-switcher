import { Injectable } from "@nestjs/common";
import { CreatePaymentDto } from "src/common/dto/payment.dto";

@Injectable()
export class PaymentsService {
    async processPayment(paymentDto: CreatePaymentDto) {
        return {
            transactionId: 'txn_1234567890',
            status: 'success',
            amount: paymentDto.amount,
            currency: paymentDto.currency,
            provider: 'ProviderA',
            timestamp: new Date()
        };
    }
}
