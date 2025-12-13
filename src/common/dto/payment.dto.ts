export class CreatePaymentDto {
    amount: number;
    currency: string;
    customerId: string;
    customerEmail: string;
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