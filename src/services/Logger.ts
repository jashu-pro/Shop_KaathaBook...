/* Logger.ts */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class LoggerService {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] - ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }
}

export const Logger = new LoggerService();
