# Logger Package

This package provides a singleton-based logger utility built using [Winston](https://github.com/winstonjs/winston). It offers customizable log levels and supports structured logging for general application logs and HTTP requests.

## Features
- Singleton pattern ensures a single logger instance.
- Dynamic log level configuration and log filename prefix.
- Pre-configured winston logger for general usage (`logger`).

## Usage

### Adding as a package
Add this package as a dependency in package.json
```typescript
dependency: {
    ...
    @plane/logger":"*",
    ...
}
```

### Importing the Logger
```typescript
import PlaneLogger from "@plane/logger";
```

### `logger`: General Logger
Use this for general application logs.

```typescript
const loggerOptions: ILoggerOptions = { logLevel:"info", logFilePrefix: "log-file-prefix" }

import ClientLogger from "@plane/logger/client"
const logger = ClientLogger.getLogger(loggerOptions);
logger.log("test logs on web")


import ServerLogger from "@plane/logger/server"
const logger = ServerLogger.getLogger(loggerOptions);
logger.log("test logs on server")

logger.info("This is an info log");
logger.warn("This is a warning");
logger.error("This is an error");
```

## Available Log Levels
- `error`
- `warn`
- `info` (default)
- `http`
- `verbose`
- `debug`
- `silly`

## Configuration
- By default, the log level is set to `info`. 
- You can specify a log level during the first import of logger by passing optional logLevel param in getLogger function.