import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";

export abstract class PaymentHandler {
    protected nextHandler: PaymentHandler | null = null;

    setNext(handler: PaymentHandler): PaymentHandler {
        this.nextHandler = handler;
        return handler;
    }

    async handle(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        try {
            return await this.processPayment(payment);
        } catch (error) {
            if (this.nextHandler) {
                console.log(`Handler failed, trying next…`);
                return this.nextHandler.handle(payment);
            }
            throw error;
        }
    }

    protected abstract processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto>;
}
