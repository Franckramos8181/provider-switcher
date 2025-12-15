import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProviderCService } from './provider-c.service';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { CreatePaymentDto } from '../common/dto/payment.dto';
import * as retryUtil from '../common/utils/retry.util';

describe('ProviderCService', () => {
  let service: ProviderCService;
  let httpService: HttpService;
  let logger: CustomLogger;

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderCService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: CustomLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ProviderCService>(ProviderCService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<CustomLogger>(CustomLogger);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getName', () => {
    it('should return ProviderC', () => {
      expect(service.getName()).toBe('ProviderC');
    });
  });

  describe('isHealthy', () => {
    it('should return true', () => {
      expect(service.isHealthy()).toBe(true);
    });
  });

  describe('processPayment', () => {
    const mockPayment: CreatePaymentDto = {
      amount: 500.0,
      currency: 'CAD',
      customerId: 'cust789',
      customerEmail: 'test@example.com',
      scenario: 'approved',
    };

    const mockProviderResponse = {
      data: {
        transaction_id: 'txn_345678',
        amount: 500.0,
        currency: 'CAD',
        timestamp: new Date('2025-12-15T12:00:00Z'),
      },
    };

    beforeEach(() => {
      jest.spyOn(retryUtil, 'retry').mockImplementation(async (maxAttempts, delay, fn) => {
        return await fn();
      });
    });

    it('should successfully process payment with approved scenario', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      const result = await service.processPayment(mockPayment);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Starting payment with ProviderC',
        'ProviderCService',
      );

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3004/pagos',
        {
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          customer: {
            id: mockPayment.customerId,
          },
          scenario: 'approved',
        },
      );

      expect(mockLogger.log).toHaveBeenCalledWith(
        'Payment successful with ProviderC',
        'ProviderCService',
        {
          transactionId: 'txn_345678',
        },
      );

      expect(result).toEqual({
        transactionId: 'txn_345678',
        status: 'success',
        amount: 500.0,
        currency: 'CAD',
        provider: 'ProviderC',
        timestamp: mockProviderResponse.data.timestamp,
      });
    });

    it('should use default scenario when scenario is not provided', async () => {
      const paymentWithoutScenario = { ...mockPayment };
      delete paymentWithoutScenario.scenario;

      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(paymentWithoutScenario);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3004/pagos',
        {
          amount: paymentWithoutScenario.amount,
          currency: paymentWithoutScenario.currency,
          customer: {
            id: paymentWithoutScenario.customerId,
          },
          scenario: 'approved',
        },
      );
    });

    it('should handle HTTP error with response', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
        message: 'Server error',
        code: 'ERR_INTERNAL_SERVER',
        config: {
          url: 'http://localhost:3004/pagos',
        },
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(errorResponse);

      await expect(service.processPayment(mockPayment)).rejects.toThrow(
        'Message: Server error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderC',
        errorResponse.stack,
        'ProviderCService',
        {
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          httpStatus: 500,
          errorCode: 'ERR_INTERNAL_SERVER',
          errorMessage: 'Server error',
          url: 'http://localhost:3004/pagos',
        },
      );
    });

    it('should handle error without response or code', async () => {
      const error = {
        message: 'Unknown error',
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(error);

      await expect(service.processPayment(mockPayment)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderC',
        error.stack,
        'ProviderCService',
        expect.objectContaining({
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          errorMessage: 'Unknown error',
        }),
      );
    });

    it('should format provider request correctly', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(mockPayment);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3004/pagos',
        expect.objectContaining({
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          customer: expect.objectContaining({
            id: mockPayment.customerId,
          }),
        }),
      );
    });

    it('should call retry utility with correct parameters (3 attempts)', async () => {
      const retrySpy = jest.spyOn(retryUtil, 'retry');
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(mockPayment);

      expect(retrySpy).toHaveBeenCalledWith(
        3,
        500,
        expect.any(Function),
        mockLogger,
        'ProviderCService',
      );
    });

    it('should handle service-unavailable scenario', async () => {
      const unavailablePayment: CreatePaymentDto = {
        ...mockPayment,
        scenario: 'service-unavailable',
      };

      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(unavailablePayment);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3004/pagos',
        expect.objectContaining({
          scenario: 'service-unavailable',
        }),
      );
    });

    it('should handle unprocessable-entity scenario', async () => {
      const unprocessablePayment: CreatePaymentDto = {
        ...mockPayment,
        scenario: 'unprocessable-entity',
      };

      const errorResponse = {
        response: {
          status: 422,
          data: { error: 'Unprocessable entity' },
        },
        message: 'Validation failed',
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(errorResponse);

      await expect(service.processPayment(unprocessablePayment)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderC',
        expect.any(String),
        'ProviderCService',
        expect.objectContaining({
          httpStatus: 422,
        }),
      );
    });

    it('should handle different currencies', async () => {
      const currencies = ['USD', 'EUR', 'JPY', 'AUD'];

      for (const currency of currencies) {
        const payment = { ...mockPayment, currency };
        const response = {
          data: {
            ...mockProviderResponse.data,
            currency,
          },
        };
        mockHttpService.axiosRef.post.mockResolvedValue(response);

        const result = await service.processPayment(payment);

        expect(result.currency).toBe(currency);
      }
    });
  });
});
