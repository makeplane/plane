export interface ILoggerOptions {
    logLevel?: string,
    logFilePrefix?: string
}
export interface ILogger {
    private instance?: any;
    private logger?: WinstonLogger; // The Winston logger instance
    logLevel?: string; // The current logging level
    logFilePrefix?: string;
    // Method to get the logger instance
    getLogger(loggerOptions: ILoggerOptions): WinstonLogger;
}

export interface IClientLogMethods {
    error: (message: string, ...metadata: any[]) => void;
    warn: (message: string, ...metadata: any[]) => void;
    info: (message: string, ...metadata: any[]) => void;
    debug: (message: string, ...metadata: any[]) => void;
}