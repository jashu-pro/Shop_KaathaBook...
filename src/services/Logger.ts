/* Logger.ts */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class LoggerService {
  private isDevelopment = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.DEV : true;


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
