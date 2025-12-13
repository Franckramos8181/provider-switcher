import { CreatePaymentDto, PaymentResponseDto } from "../dto/payment.dto";

export interface IPaymentProvider {
    processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto>
    getName(): string;
    isHealthy(): boolean
}

