import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { CreatePaymentDto, PaymentResponseDto } from "src/common/dto/payment.dto";
import { IPaymentProvider } from "src/common/interfaces/payment-provider.interface";
import { retry } from "src/common/utils/retry.util";
import { CustomLogger } from "src/common/logger/custom-logger.service";

@Injectable()
export class ProviderCService implements IPaymentProvider {
    private readonly apiURL = 'http://localhost:3004/pagos';
    private readonly DEFAULT_SCENARIO = 'approved';

    constructor(
        private readonly httpService: HttpService,
        private readonly logger: CustomLogger,
    ) {}

    getName(): string {
        return 'ProviderC';
    }

    isHealthy(): boolean {
        return true;
    }

    async processPayment(payment: CreatePaymentDto): Promise<PaymentResponseDto> {
        this.logger.debug('Starting payment with ProviderC', 'ProviderCService');

        return retry(
            3,    // maxAttempts
            500, // initialDelayMs
            async () => {
                try {
                    const providerCFormat = {
                        amount: payment.amount,
                        currency: payment.currency,
                        customer: {
                            id: payment.customerId,
                        },
                        scenario: payment.scenario || this.DEFAULT_SCENARIO
                    };

                    const response = await this.httpService.axiosRef.post(
                        this.apiURL,
                        providerCFormat,
                    );
                    
                    this.logger.log('Payment successful with ProviderC', 'ProviderCService', {
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
                        'Payment failed with ProviderC',
                        error.stack,
                        'ProviderCService',
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
            'ProviderCService',
        );
    }
}
