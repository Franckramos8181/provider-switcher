import { IPaymentProvider } from "src/common/interfaces/payment-provider.interface";
import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { PaymentHandler } from "./payment-handler";
import { CustomLogger } from "src/common/logger/custom-logger.service";

export class ProviderHandler extends PaymentHandler {
    constructor(
        private readonly provider: IPaymentProvider,
        logger?: CustomLogger,
    ) {
        super();
        if (logger) this.logger = logger;
    }

    protected getProviderName(): string {
        return this.provider.getName();
    }

    protected async processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        this.logger?.log(
            'Attempting payment processing', `ProviderHandler ${this.getProviderName()}`
        );
        return this.provider.processPayment(payment);
    }
}
