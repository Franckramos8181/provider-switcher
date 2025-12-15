import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { PaymentProvidersUnavailableException } from "src/common/exceptions/payment-providers-unavailable.exception";
import { CustomLogger } from "src/common/logger/custom-logger.service";

export abstract class PaymentHandler {
    protected nextHandler: PaymentHandler | null = null;
    protected logger: CustomLogger;

    // Each concrete handler must implement these methods
    protected abstract processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto>;
    protected abstract getProviderName(): string;

    setNext(handler: PaymentHandler): PaymentHandler {
        this.nextHandler = handler;
        return handler;
    }

    async handle(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        try {
            return await this.processPayment(payment);
        } catch (error) {
            if (this.nextHandler) {
                this.logger?.warn(
                    'Provider failed, switching to next provider',
                    'PaymentHandler',
                    {
                        failedProvider: this.getProviderName(),
                        errorMessage: error.message,
                        amount: payment.amount,
                        currency: payment.currency,
                    }
                );
                return this.nextHandler.handle(payment);
            }
            // No more handlers available - all providers failed
            this.logger?.error('All payment providers failed', error.stack, 'PaymentHandler');
            throw new PaymentProvidersUnavailableException();
        }
    }
}
