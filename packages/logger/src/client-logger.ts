import { createLogger, format, transports, Logger as WinstonLogger } from "winston";


export default class ClientLogger {
  private static instance: ClientLogger;
  private logger: WinstonLogger;
  private logLevel: string;

  private constructor(logLevel: string = "info") {

    this.logLevel = logLevel;

    this.logger = createLogger({
      level: this.logLevel,
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: "DD/MMM/YYYY HH:mm:ss",
        }),
        format.printf(({ timestamp, level, message, ...metadata }) => {
          const msg = `[${timestamp}] "${level}" ${message}`;
          const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
          return msg + metaString;
        })
      ),
      transports: [
        new transports.Console({ handleExceptions: true })
      ],
    });

    this.logger.transports.forEach((transport) => {
        transport.on("error", (err) => {
          // Handle the error, log it, or notify as necessary
          console.error(`Logging transport error: Console`, err);
        });
    });

  }

  private static getInstance(logLevel?: string) {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger(logLevel);
    } 
    return ClientLogger.instance;
  }

  public static getLogger(logLevel?: string) {
    const instance = ClientLogger.getInstance(logLevel);
    return instance.logger
  }

}
  
