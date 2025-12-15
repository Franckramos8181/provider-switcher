import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProviderBService } from './provider-b.service';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { CreatePaymentDto } from '../common/dto/payment.dto';
import * as retryUtil from '../common/utils/retry.util';

describe('ProviderBService', () => {
  let service: ProviderBService;
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
        ProviderBService,
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

    service = module.get<ProviderBService>(ProviderBService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<CustomLogger>(CustomLogger);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getName', () => {
    it('should return ProviderB', () => {
      expect(service.getName()).toBe('ProviderB');
    });
  });

  describe('isHealthy', () => {
    it('should return true', () => {
      expect(service.isHealthy()).toBe(true);
    });
  });

  describe('processPayment', () => {
    const mockPayment: CreatePaymentDto = {
      amount: 250.75,
      currency: 'GBP',
      customerId: 'cust456',
      customerEmail: 'test@example.com',
      scenario: 'approved',
    };

    const mockProviderResponse = {
      data: {
        transaction_id: 'txn_789012',
        amount: 250.75,
        currency: 'GBP',
        timestamp: new Date('2025-12-15T11:00:00Z'),
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
        'Starting payment with ProviderB',
        'ProviderBService',
      );

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3003/payments',
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
        'Payment successful with ProviderB',
        'ProviderBService',
        {
          transactionId: 'txn_789012',
        },
      );

      expect(result).toEqual({
        transactionId: 'txn_789012',
        status: 'success',
        amount: 250.75,
        currency: 'GBP',
        provider: 'ProviderB',
        timestamp: mockProviderResponse.data.timestamp,
      });
    });

    it('should use default scenario when scenario is not provided', async () => {
      const paymentWithoutScenario = { ...mockPayment };
      delete paymentWithoutScenario.scenario;

      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(paymentWithoutScenario);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3003/payments',
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
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
        message: 'Too many requests',
        code: 'ERR_TOO_MANY_REQUESTS',
        config: {
          url: 'http://localhost:3003/payments',
        },
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(errorResponse);

      await expect(service.processPayment(mockPayment)).rejects.toThrow(
        'Message: Too many requests',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderB',
        errorResponse.stack,
        'ProviderBService',
        {
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          httpStatus: 429,
          errorCode: 'ERR_TOO_MANY_REQUESTS',
          errorMessage: 'Too many requests',
          url: 'http://localhost:3003/payments',
        },
      );
    });

    it('should handle error without response', async () => {
      const error = {
        message: 'Connection timeout',
        code: 'ETIMEDOUT',
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(error);

      await expect(service.processPayment(mockPayment)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderB',
        error.stack,
        'ProviderBService',
        expect.objectContaining({
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          errorCode: 'ETIMEDOUT',
          errorMessage: 'Connection timeout',
        }),
      );
    });

    it('should format provider request correctly', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(mockPayment);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3003/payments',
        expect.objectContaining({
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          customer: expect.objectContaining({
            id: mockPayment.customerId,
          }),
        }),
      );
    });

    it('should call retry utility with correct parameters (1 attempt)', async () => {
      const retrySpy = jest.spyOn(retryUtil, 'retry');
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(mockPayment);

      expect(retrySpy).toHaveBeenCalledWith(
        1,
        500,
        expect.any(Function),
        mockLogger,
        'ProviderBService',
      );
    });

    it('should handle different payment scenarios', async () => {
      const scenarios: Array<'approved' | 'rate-limit-exceeded' | 'internal-server-error'> = [
        'approved',
        'rate-limit-exceeded',
        'internal-server-error',
      ];

      for (const scenario of scenarios) {
        const payment = { ...mockPayment, scenario };
        mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

        await service.processPayment(payment);

        expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
          'http://localhost:3003/payments',
          expect.objectContaining({
            scenario,
          }),
        );
      }
    });
  });
});
