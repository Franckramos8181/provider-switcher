import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { IPaymentProvider } from "src/common/interfaces/payment-provider.interface";
import { retry } from "src/common/utils/retry.util";
import { CustomLogger } from "src/common/logger/custom-logger.service";

@Injectable()
export class ProviderBService implements IPaymentProvider {
    private readonly apiURL = 'http://localhost:3003/payments';
    private readonly DEFAULT_SCENARIO = 'approved';

    constructor(
        private readonly httpService: HttpService,
        private readonly logger: CustomLogger,
    ) {}

    getName(): string {
        return 'ProviderB';
    }

    isHealthy(): boolean {
        return true;
    }

    async processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        this.logger.debug('Starting payment with ProviderB', 'ProviderBService');

        return retry(
            1,    // maxAttempts
            500, // initialDelayMs
            async () => {
                try {
                    const providerBFormat = {
                        amount: payment.amount,
                        currency: payment.currency,
                        customer: {
                            id: payment.customerId,
                        },
                        scenario: payment.scenario || this.DEFAULT_SCENARIO
                    };

                    const response = await this.httpService.axiosRef.post(
                        this.apiURL,
                        providerBFormat,
                    );
                    
                    this.logger.log('Payment successful with ProviderB', 'ProviderBService', {
                        transactionId: response.data.transaction_id,
                    });
                    
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
                    
                    this.logger.error(
                        'Payment failed with ProviderB',
                        error.stack,
                        'ProviderBService',
                        {
                            amount: payment.amount,
                            currency: payment.currency,
                            httpStatus: error.response?.status,
                            errorCode: error.code,
                            errorMessage: error.message,
                            url: this.apiURL,
                        }
                    );
                    
                    throw new Error(errorDetails.join(', '));
                }
            },
            this.logger,
            'ProviderBService',
        );
    }
}
