/**
 * Centralized logging service with error tracking and analytics
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId: string;
}

class LoggerService {
  private sessionId: string;
  private logQueue: LogEntry[] = [];
  private readonly maxQueueSize = 100;
  private readonly flushInterval = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startFlushInterval(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      sessionId: this.sessionId,
    };
  }

  private enqueue(entry: LogEntry): void {
    this.logQueue.push(entry);
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift(); // Remove oldest
    }

    // Always log errors to console immediately
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      this.logToConsole(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.error || '', entry.context || '');
        break;
    }
  }

  private flush(): void {
    if (this.logQueue.length === 0) return;

    // In production, send to logging service (e.g., Sentry, LogRocket)
    // For now, just clear the queue after logging to console
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service
      // Example: Sentry.captureMessage(), LogRocket.track()
    }

    this.logQueue = [];
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.enqueue(this.createEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.enqueue(this.createEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.enqueue(this.createEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.enqueue(this.createEntry(LogLevel.ERROR, message, context, error));
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.enqueue(this.createEntry(LogLevel.FATAL, message, context, error));
    this.flush(); // Immediate flush for fatal errors
  }

  setUserId(userId: string): void {
    this.logQueue.forEach(entry => {
      if (!entry.userId) entry.userId = userId;
    });
  }

  // Performance tracking
  trackPerformance(operation: string, durationMs: number, success: boolean): void {
    this.info(`Performance: ${operation}`, {
      durationMs,
      success,
      operation,
    });
  }

  // API call tracking
  trackApiCall(endpoint: string, method: string, durationMs: number, statusCode: number): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.enqueue(this.createEntry(level, `API ${method} ${endpoint}`, {
      endpoint,
      method,
      durationMs,
      statusCode,
    }));
  }
}

export const logger = new LoggerService();
