import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { PaymentProvidersUnavailableException } from "src/common/exceptions/payment-providers-unavailable.exception";

export abstract class PaymentHandler {
    protected nextHandler: PaymentHandler | null = null;

    // Each concrete handler must implement this method
    protected abstract processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto>;

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
            // No more handlers available - all providers failed
            throw new PaymentProvidersUnavailableException();
        }
    }
}
