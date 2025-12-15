import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  private formatLogMessage(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): string {
    const logObject = {
    //   timestamp: new Date().toISOString(),
    //   level: level.toUpperCase(),
      context: context || 'Application',
      message,
      ...(metadata && { metadata })
    };

    return JSON.stringify(logObject);
  }

  log(message: string, context?: string, metadata?: Record<string, any>) {
    super.log(this.formatLogMessage('log', message, context, metadata));
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, any>,
  ) {
    const errorMetadata = {
      ...metadata,
      ...(trace && { trace }),
    };
    super.error(this.formatLogMessage('error', message, context, errorMetadata));
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    super.warn(this.formatLogMessage('warn', message, context, metadata));
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    super.debug(this.formatLogMessage('debug', message, context, metadata));
  }

  verbose(message: string, context?: string, metadata?: Record<string, any>) {
    super.verbose(this.formatLogMessage('verbose', message, context, metadata));
  }
}
