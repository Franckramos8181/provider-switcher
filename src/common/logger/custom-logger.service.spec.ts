import { Test, TestingModule } from '@nestjs/testing';
import { CustomLogger } from './custom-logger.service';
import { ConsoleLogger } from '@nestjs/common';

describe('CustomLogger', () => {
  let logger: CustomLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomLogger],
    }).compile();

    logger = module.get<CustomLogger>(CustomLogger);

    // Spy on the parent class methods
    jest.spyOn(ConsoleLogger.prototype, 'log').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'error').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'warn').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'debug').mockImplementation();
    jest.spyOn(ConsoleLogger.prototype, 'verbose').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log', () => {
    it('should format and log a message with context', () => {
      const message = 'Test log message';
      const context = 'TestContext';

      logger.log(message, context);

      expect(ConsoleLogger.prototype.log).toHaveBeenCalledWith(
        JSON.stringify({
          context: 'TestContext',
          message: 'Test log message',
        }),
      );
    });

    it('should log a message with metadata', () => {
      const message = 'Payment processed';
      const context = 'PaymentService';
      const metadata = { transactionId: 'txn_123', amount: 100 };

      logger.log(message, context, metadata);

      const expectedLog = JSON.stringify({
        context: 'PaymentService',
        message: 'Payment processed',
        metadata: {
          transactionId: 'txn_123',
          amount: 100,
        },
      });

      expect(ConsoleLogger.prototype.log).toHaveBeenCalledWith(expectedLog);
    });

    it('should use default context when not provided', () => {
      const message = 'Default context test';

      logger.log(message);

      expect(ConsoleLogger.prototype.log).toHaveBeenCalledWith(
        JSON.stringify({
          context: 'Application',
          message: 'Default context test',
        }),
      );
    });

    it('should not include metadata when not provided', () => {
      const message = 'Simple log';
      const context = 'SimpleContext';

      logger.log(message, context);

      const logCall = (ConsoleLogger.prototype.log as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject).toEqual({
        context: 'SimpleContext',
        message: 'Simple log',
      });
      expect(logObject.metadata).toBeUndefined();
    });
  });

  describe('error', () => {
    it('should format and log an error with trace', () => {
      const message = 'Test error message';
      const trace = 'Error stack trace';
      const context = 'ErrorContext';

      logger.error(message, trace, context);

      const expectedLog = JSON.stringify({
        context: 'ErrorContext',
        message: 'Test error message',
        metadata: {
          trace: 'Error stack trace',
        },
      });

      expect(ConsoleLogger.prototype.error).toHaveBeenCalledWith(expectedLog);
    });

    it('should log error with metadata and trace', () => {
      const message = 'Payment failed';
      const trace = 'Error: Payment failed\n    at processPayment';
      const context = 'PaymentService';
      const metadata = { userId: 'user123', amount: 50 };

      logger.error(message, trace, context, metadata);

      const expectedLog = JSON.stringify({
        context: 'PaymentService',
        message: 'Payment failed',
        metadata: {
          userId: 'user123',
          amount: 50,
          trace: 'Error: Payment failed\n    at processPayment',
        },
      });

      expect(ConsoleLogger.prototype.error).toHaveBeenCalledWith(expectedLog);
    });

    it('should handle error without trace', () => {
      const message = 'Simple error';
      const context = 'SimpleContext';

      logger.error(message, undefined, context);

      const logCall = (ConsoleLogger.prototype.error as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject.context).toBe('SimpleContext');
      expect(logObject.message).toBe('Simple error');
      // Empty metadata object is included when no trace is provided
      expect(logObject.metadata).toEqual({});
    });

    it('should use default context when not provided', () => {
      const message = 'Error without context';

      logger.error(message);

      const logCall = (ConsoleLogger.prototype.error as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject.context).toBe('Application');
    });
  });

  describe('warn', () => {
    it('should format and log a warning with context', () => {
      const message = 'Test warning message';
      const context = 'WarnContext';

      logger.warn(message, context);

      expect(ConsoleLogger.prototype.warn).toHaveBeenCalledWith(
        JSON.stringify({
          context: 'WarnContext',
          message: 'Test warning message',
        }),
      );
    });

    it('should log warning with metadata', () => {
      const message = 'Retry attempt';
      const context = 'RetryUtil';
      const metadata = { attempt: 2, maxAttempts: 3 };

      logger.warn(message, context, metadata);

      const expectedLog = JSON.stringify({
        context: 'RetryUtil',
        message: 'Retry attempt',
        metadata: {
          attempt: 2,
          maxAttempts: 3,
        },
      });

      expect(ConsoleLogger.prototype.warn).toHaveBeenCalledWith(expectedLog);
    });
  });

  describe('debug', () => {
    it('should format and log a debug message with context', () => {
      const message = 'Debug information';
      const context = 'DebugContext';

      logger.debug(message, context);

      expect(ConsoleLogger.prototype.debug).toHaveBeenCalledWith(
        JSON.stringify({
          context: 'DebugContext',
          message: 'Debug information',
        }),
      );
    });

    it('should log debug message with detailed metadata', () => {
      const message = 'Request details';
      const context = 'HttpService';
      const metadata = {
        url: 'http://example.com',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      logger.debug(message, context, metadata);

      const expectedLog = JSON.stringify({
        context: 'HttpService',
        message: 'Request details',
        metadata,
      });

      expect(ConsoleLogger.prototype.debug).toHaveBeenCalledWith(expectedLog);
    });
  });

  describe('verbose', () => {
    it('should format and log a verbose message with context', () => {
      const message = 'Verbose information';
      const context = 'VerboseContext';

      logger.verbose(message, context);

      expect(ConsoleLogger.prototype.verbose).toHaveBeenCalledWith(
        JSON.stringify({
          context: 'VerboseContext',
          message: 'Verbose information',
        }),
      );
    });

    it('should log verbose message with metadata', () => {
      const message = 'Detailed execution info';
      const context = 'ExecutionContext';
      const metadata = { step: 1, duration: 150, status: 'processing' };

      logger.verbose(message, context, metadata);

      const expectedLog = JSON.stringify({
        context: 'ExecutionContext',
        message: 'Detailed execution info',
        metadata: {
          step: 1,
          duration: 150,
          status: 'processing',
        },
      });

      expect(ConsoleLogger.prototype.verbose).toHaveBeenCalledWith(expectedLog);
    });
  });

  describe('formatLogMessage', () => {
    it('should handle empty metadata object', () => {
      const message = 'Test message';
      const context = 'TestContext';

      logger.log(message, context, {});

      const logCall = (ConsoleLogger.prototype.log as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject).toEqual({
        context: 'TestContext',
        message: 'Test message',
        metadata: {},
      });
    });

    it('should handle complex nested metadata', () => {
      const message = 'Complex log';
      const context = 'ComplexContext';
      const metadata = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        transaction: {
          id: 'txn_456',
          items: ['item1', 'item2'],
        },
      };

      logger.log(message, context, metadata);

      const logCall = (ConsoleLogger.prototype.log as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject.metadata).toEqual(metadata);
    });

    it('should handle metadata with special characters', () => {
      const message = 'Special characters test';
      const context = 'SpecialContext';
      const metadata = {
        specialString: 'Line 1\nLine 2\tTabbed',
        quote: 'He said "hello"',
      };

      logger.log(message, context, metadata);

      const logCall = (ConsoleLogger.prototype.log as jest.Mock).mock.calls[0][0];
      const logObject = JSON.parse(logCall);

      expect(logObject.metadata).toEqual(metadata);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple consecutive logs', () => {
      logger.log('First log', 'Context1');
      logger.warn('Warning log', 'Context2');
      logger.error('Error log', 'stack trace', 'Context3');

      expect(ConsoleLogger.prototype.log).toHaveBeenCalledTimes(1);
      expect(ConsoleLogger.prototype.warn).toHaveBeenCalledTimes(1);
      expect(ConsoleLogger.prototype.error).toHaveBeenCalledTimes(1);
    });

    it('should maintain consistent JSON format across all log levels', () => {
      const context = 'ConsistentContext';
      const metadata = { key: 'value' };

      logger.log('Log message', context, metadata);
      logger.warn('Warn message', context, metadata);
      logger.debug('Debug message', context, metadata);
      logger.verbose('Verbose message', context, metadata);

      const logCall = (ConsoleLogger.prototype.log as jest.Mock).mock.calls[0][0];
      const warnCall = (ConsoleLogger.prototype.warn as jest.Mock).mock.calls[0][0];
      const debugCall = (ConsoleLogger.prototype.debug as jest.Mock).mock.calls[0][0];
      const verboseCall = (ConsoleLogger.prototype.verbose as jest.Mock).mock.calls[0][0];

      // All should be valid JSON
      expect(() => JSON.parse(logCall)).not.toThrow();
      expect(() => JSON.parse(warnCall)).not.toThrow();
      expect(() => JSON.parse(debugCall)).not.toThrow();
      expect(() => JSON.parse(verboseCall)).not.toThrow();

      // All should have consistent structure
      const logObj = JSON.parse(logCall);
      const warnObj = JSON.parse(warnCall);
      const debugObj = JSON.parse(debugCall);
      const verboseObj = JSON.parse(verboseCall);

      expect(Object.keys(logObj)).toEqual(['context', 'message', 'metadata']);
      expect(Object.keys(warnObj)).toEqual(['context', 'message', 'metadata']);
      expect(Object.keys(debugObj)).toEqual(['context', 'message', 'metadata']);
      expect(Object.keys(verboseObj)).toEqual(['context', 'message', 'metadata']);
    });
  });
});
