import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from 'src/common/dto/payment.dto';

@Controller ('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    async createPayment(@Body() paymentDto: CreatePaymentDto) {
        return this.paymentsService.processPayment(paymentDto);
    }
}
