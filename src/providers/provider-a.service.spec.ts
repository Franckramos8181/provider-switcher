import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProviderAService } from './provider-a.service';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { CreatePaymentDto } from '../common/dto/payment.dto';
import * as retryUtil from '../common/utils/retry.util';

describe('ProviderAService', () => {
  let service: ProviderAService;
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
        ProviderAService,
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

    service = module.get<ProviderAService>(ProviderAService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<CustomLogger>(CustomLogger);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getName', () => {
    it('should return ProviderA', () => {
      expect(service.getName()).toBe('ProviderA');
    });
  });

  describe('isHealthy', () => {
    it('should return true', () => {
      expect(service.isHealthy()).toBe(true);
    });
  });

  describe('processPayment', () => {
    const mockPayment: CreatePaymentDto = {
      amount: 100.5,
      currency: 'USD',
      customerId: 'cust123',
      customerEmail: 'test@example.com',
      scenario: 'approved',
    };

    const mockProviderResponse = {
      data: {
        transaction_id: 'txn_123456',
        amount: 100.5,
        currency: 'USD',
        timestamp: new Date('2025-12-15T10:00:00Z'),
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
        'Starting payment with ProviderA',
        'ProviderAService',
      );

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/payments',
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
        'Payment successful with ProviderA',
        'ProviderAService',
        {
          transactionId: 'txn_123456',
        },
      );

      expect(result).toEqual({
        transactionId: 'txn_123456',
        status: 'success',
        amount: 100.5,
        currency: 'USD',
        provider: 'ProviderA',
        timestamp: mockProviderResponse.data.timestamp,
      });
    });

    it('should use default scenario when scenario is not provided', async () => {
      const paymentWithoutScenario = { ...mockPayment };
      delete paymentWithoutScenario.scenario;

      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(paymentWithoutScenario);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/payments',
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
          status: 503,
          data: { error: 'Service unavailable' },
        },
        message: 'Request failed',
        code: 'ECONNREFUSED',
        config: {
          url: 'http://localhost:3002/api/v1/payments',
        },
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(errorResponse);

      await expect(service.processPayment(mockPayment)).rejects.toThrow(
        'Message: Request failed',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderA',
        errorResponse.stack,
        'ProviderAService',
        {
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          httpStatus: 503,
          errorCode: 'ECONNREFUSED',
          errorMessage: 'Request failed',
          url: 'http://localhost:3002/api/v1/payments',
        },
      );
    });

    it('should handle error without response', async () => {
      const error = {
        message: 'Network error',
        code: 'ENETUNREACH',
        stack: 'Error stack trace',
      };

      mockHttpService.axiosRef.post.mockRejectedValue(error);

      await expect(service.processPayment(mockPayment)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Payment failed with ProviderA',
        error.stack,
        'ProviderAService',
        expect.objectContaining({
          amount: mockPayment.amount,
          currency: mockPayment.currency,
          errorCode: 'ENETUNREACH',
          errorMessage: 'Network error',
        }),
      );
    });

    it('should format provider request correctly for different amounts', async () => {
      const highAmountPayment: CreatePaymentDto = {
        amount: 9999.99,
        currency: 'EUR',
        customerId: 'cust999',
        customerEmail: 'high@example.com',
        scenario: 'approved',
      };

      mockHttpService.axiosRef.post.mockResolvedValue({
        data: {
          transaction_id: 'txn_999',
          amount: 9999.99,
          currency: 'EUR',
          timestamp: new Date(),
        },
      });

      await service.processPayment(highAmountPayment);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/payments',
        {
          amount: 9999.99,
          currency: 'EUR',
          customer: {
            id: 'cust999',
          },
          scenario: 'approved',
        },
      );
    });

    it('should call retry utility with correct parameters', async () => {
      const retrySpy = jest.spyOn(retryUtil, 'retry');
      mockHttpService.axiosRef.post.mockResolvedValue(mockProviderResponse);

      await service.processPayment(mockPayment);

      expect(retrySpy).toHaveBeenCalledWith(
        2,
        500,
        expect.any(Function),
        mockLogger,
        'ProviderAService',
      );
    });
  });
});
