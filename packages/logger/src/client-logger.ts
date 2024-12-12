import { IClientLogMethods, ILoggerOptions } from "index";

export default class ClientLogger {
  private logLevel: string;
  private logLevels: string[];
  logMethods: IClientLogMethods;
  static instance: any;

  constructor(loggerOptions: ILoggerOptions = { logLevel: "info", logFilePrefix: "log" }) {    
    this.logLevel = loggerOptions.logLevel || 'info';
    this.logMethods = {
      error: this.logWithLevel.bind(this, "error"),
      warn: this.logWithLevel.bind(this, "warn"),
      info: this.logWithLevel.bind(this, "info"),
      debug: this.logWithLevel.bind(this, "debug"),
    };
    this.logLevels = ["error", "warn", "info", "debug"];
  }

  static getInstance(loggerOptions?: ILoggerOptions) {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger(loggerOptions);
    }
    return ClientLogger.instance;
  }

  public static getLogger(loggerOptions?: ILoggerOptions): IClientLogMethods {
    const instance = this.getInstance(loggerOptions);
    return instance.logMethods;
  }

  logWithLevel(level: string, message: string, ...metadata: any[]) {
    if (this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel)) {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] "${level.toUpperCase()}" ${message}`;
      const metaString = metadata.length ? ` ${JSON.stringify(metadata)}` : "";

      // Override to console.log equivalent
      switch (level) {
        case "error":
          console.error(formattedMessage + metaString);
          break;
        case "warn":
          console.warn(formattedMessage + metaString);
          break;
        case "info":
          console.info(formattedMessage + metaString);
          break;
        case "debug":
          console.log(formattedMessage + metaString);
          break;
      }
    }
  }
}