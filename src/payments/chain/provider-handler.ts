import { IPaymentProvider } from "src/common/interfaces/payment-provider.interface";
import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { PaymentHandler } from "./payment-handler";

export class ProviderHandler extends PaymentHandler {
    constructor(private readonly provider: IPaymentProvider) {
        super();
    }

    protected async processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        console.log(`Processing with ${this.provider.getName()}`);
        return this.provider.processPayment(payment);
    }
}
