import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentProvidersUnavailableException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'All payment providers are currently unavailable',
        error: 'Payment Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
