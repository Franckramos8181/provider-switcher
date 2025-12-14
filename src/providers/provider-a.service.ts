import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { IPaymentProvider } from "src/common/interfaces/payment-provider.interface";

@Injectable()
export class ProviderAService implements IPaymentProvider {
    private readonly apiURL = 'http://localhost:3002/api/v1/payments';
    private readonly DEFAULT_SCENARIO = 'approved';

    constructor(private readonly httpService: HttpService) {}

    getName(): string {
        return 'ProviderA';
    }

    isHealthy(): boolean {
        return true;
    }

    async processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        try {
            const providerAFormat = {
                amount: payment.amount,
                currency: payment.currency,
                customer: {
                    id: payment.customerId,
                },
                scenario: payment.scenario || this.DEFAULT_SCENARIO
            };

            const response = await this.httpService.axiosRef.post(
                this.apiURL,
                providerAFormat,
            )
            return {
                transactionId: response.data.transaction_id,
                status: 'success',
                amount: response.data.amount,
                currency: response.data.currency,
                provider: this.getName(),
                timestamp: response.data.timestamp,
            };
        } catch (error) {
            const errorDetails: string[] = [];
            errorDetails.push(`Message: ${error.message}`);
            
            if (error.code) {
                errorDetails.push(`Code: ${error.code}`);
            }
            
            if (error.response) {
                errorDetails.push(`HTTP Status: ${error.response.status}`);
                errorDetails.push(`Response: ${JSON.stringify(error.response.data)}`);
            }
            
            if (error.config?.url) {
                errorDetails.push(`URL: ${error.config.url}`);
            }
            
            throw new Error(`Provider A failed - ${errorDetails.join(', ')}`);
        }
    }
}
