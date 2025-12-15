import { retry } from './retry.util';
import { CustomLogger } from '../logger/custom-logger.service';

describe('retry utility', () => {
  let mockLogger: jest.Mocked<CustomLogger>;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('successful execution', () => {
    it('should return result on first attempt when function succeeds', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const promise = retry(3, 1000, mockFn, mockLogger, 'TestContext');
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should work without logger provided', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retry(3, 1000, mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should work without context provided', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retry(3, 1000, mockFn, mockLogger);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should return result with different data types', async () => {
      const objectResult = { id: 1, name: 'test' };
      const mockFn = jest.fn().mockResolvedValue(objectResult);

      const result = await retry(3, 1000, mockFn);

      expect(result).toEqual(objectResult);
    });
  });

  describe('retry mechanism', () => {
    it('should retry and succeed on second attempt', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, 1000, mockFn, mockLogger, 'TestContext');

      // Fast-forward through the delay
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt failed, retrying...',
        'TestContext',
        {
          attempt: 1,
          maxAttempts: 3,
          delayMs: 1000,
          errorMessage: 'First failure',
        },
      );
    });

    it('should retry and succeed on third attempt', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, 1000, mockFn, mockLogger, 'TestContext');

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should use default maxAttempts when not provided', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValueOnce('success');

      const promise = retry(undefined, 1000, mockFn, mockLogger);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use default initialDelayMs when not provided', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, undefined, mockFn, mockLogger);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('exponential backoff', () => {
    it('should apply exponential backoff between retries', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, 500, mockFn, mockLogger, 'TestContext');

      await jest.runAllTimersAsync();
      await promise;

      expect(mockLogger.warn).toHaveBeenNthCalledWith(
        1,
        'Retry attempt failed, retrying...',
        'TestContext',
        expect.objectContaining({
          delayMs: 500,
        }),
      );

      expect(mockLogger.warn).toHaveBeenNthCalledWith(
        2,
        'Retry attempt failed, retrying...',
        'TestContext',
        expect.objectContaining({
          delayMs: 1000, // 500 * 2
        }),
      );
    });

    it('should double delay with each retry', async () => {
      let delays: number[] = [];
      const mockFn = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Fail'));
      });

      const mockWarn = jest.fn((msg, ctx, metadata) => {
        if (metadata?.delayMs) {
          delays.push(metadata.delayMs);
        }
      });
      mockLogger.warn = mockWarn;

      const promise = retry(4, 100, mockFn, mockLogger, 'TestContext');
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Fail');

      expect(delays).toEqual([100, 200, 400]);
    });
  });

  describe('failure scenarios', () => {
    it('should throw error after exhausting all retries', async () => {
      const errorMessage = 'Persistent failure';
      const mockFn = jest.fn().mockRejectedValue(new Error(errorMessage));

      const promise = retry(3, 1000, mockFn, mockLogger, 'TestContext');
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow(errorMessage);
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    it('should log error after all retries exhausted', async () => {
      const error = new Error('Final error');
      error.stack = 'Error stack trace';
      const mockFn = jest.fn().mockRejectedValue(error);

      const promise = retry(2, 500, mockFn, mockLogger, 'TestContext');
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Final error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'All retry attempts exhausted',
        'Error stack trace',
        'TestContext',
        {
          maxAttempts: 2,
          errorMessage: 'Final error',
        },
      );
    });

    it('should use default context in error log when context not provided', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Failure'));

      const promise = retry(1, 500, mockFn, mockLogger);
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Failure');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'All retry attempts exhausted',
        expect.any(String),
        'RetryUtil',
        expect.any(Object),
      );
    });

    it('should handle error without stack trace', async () => {
      const error = new Error('Error without stack');
      delete error.stack;
      const mockFn = jest.fn().mockRejectedValue(error);

      const promise = retry(1, 500, mockFn, mockLogger, 'TestContext');
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Error without stack');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'All retry attempts exhausted',
        undefined,
        'TestContext',
        expect.objectContaining({
          errorMessage: 'Error without stack',
        }),
      );
    });

    it('should fail immediately when maxAttempts is 1', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Immediate fail'));

      const promise = retry(1, 1000, mockFn, mockLogger, 'TestContext');

      await expect(promise).rejects.toThrow('Immediate fail');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero maxAttempts gracefully', async () => {
      const mockFn = jest.fn().mockResolvedValue('should not be called');

      const promise = retry(0, 1000, mockFn, mockLogger);

      await expect(promise).rejects.toThrow();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle negative maxAttempts gracefully', async () => {
      const mockFn = jest.fn().mockResolvedValue('should not be called');

      const promise = retry(-1, 1000, mockFn, mockLogger);

      await expect(promise).rejects.toThrow();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should handle very large delay values', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValueOnce('success');

      const promise = retry(2, 10000, mockFn, mockLogger);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
    });

    it('should preserve error type when rethrowing', async () => {
      class CustomError extends Error {
        constructor(message: string, public code: number) {
          super(message);
        }
      }

      const customError = new CustomError('Custom error', 404);
      const mockFn = jest.fn().mockRejectedValue(customError);

      const promise = retry(1, 1000, mockFn);
      promise.catch(() => {}); // Suppress unhandled rejection warning

      await jest.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Custom error');
      
      try {
        await promise;
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe(404);
      }
    });
  });

  describe('timing verification', () => {
    it('should wait correct amount before first retry', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValueOnce('success');

      const promise = retry(2, 1000, mockFn);

      // After first failure, should not resolve yet
      await Promise.resolve();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Advance by half the delay - still shouldn't retry
      await jest.advanceTimersByTimeAsync(500);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Advance by full delay - should retry
      await jest.advanceTimersByTimeAsync(500);
      await promise;
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should apply correct delays for multiple retries', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, 100, mockFn);

      // First call
      await Promise.resolve();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // First retry after 100ms
      await jest.advanceTimersByTimeAsync(100);
      expect(mockFn).toHaveBeenCalledTimes(2);

      // Second retry after 200ms (doubled)
      await jest.advanceTimersByTimeAsync(200);
      const result = await promise;
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });
  });

  describe('logger behavior', () => {
    it('should not log warnings when logger is not provided', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const promise = retry(2, 500, mockFn);

      await jest.runAllTimersAsync();
      await promise;

      // No logger provided, so these shouldn't be called
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should include all retry metadata in warning logs', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('success');

      const promise = retry(3, 250, mockFn, mockLogger, 'CustomContext');

      await jest.runAllTimersAsync();
      await promise;

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt failed, retrying...',
        'CustomContext',
        {
          attempt: 1,
          maxAttempts: 3,
          delayMs: 250,
          errorMessage: 'Test error',
        },
      );
    });
  });
});
