export class CreatePaymentDto {
    amount: number;
    currency: string;
    customerId: string;
    customerEmail: string;
    scenario?: 'approved' | 'rate-limit-exceeded' | 'unprocessable-entity'
        | 'internal-server-error' | 'service-unavailable';
}

export class PaymentResponseDto {
    transactionId: string;
    status: 'success' | 'failed' | 'pending'
    amount: number;
    currency: string;
    provider: string;
    timestamp: Date;
    confirmationCode?: string;
}