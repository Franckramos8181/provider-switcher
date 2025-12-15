import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from 'src/common/dto/payment.dto';
import { CustomLogger } from 'src/common/logger/custom-logger.service';

@Controller ('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly logger: CustomLogger,
    ) {}

    @Post()
    async createPayment(@Body() paymentDto: CreatePaymentDto) {
        this.logger.log('Payment request received', 'PaymentsController', paymentDto);

        try {
            const result = await this.paymentsService.processPayment(paymentDto);
            
            this.logger.log('Payment processed successfully', 'PaymentsController', result);
            
            return result;
        } catch (error) {
            this.logger.error(error.message, error.stack, 'PaymentsController', paymentDto);

            throw error;
        }
    }
}
