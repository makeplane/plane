# Logger Package

This package provides a logger and a request logger utility built using [Winston](https://github.com/winstonjs/winston). It offers customizable log levels using env and supports structured logging for general application logs and HTTP requests.

## Features.

- Dynamic log level configuration using env.
- Pre-configured winston logger for general usage (`logger`).
- Request logger middleware that logs incoming request

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
import { logger, requestLogger } from "@plane/logger";
```

### Usage

### `logger`: General Logger

Use this for general application logs.

```typescript
logger.info("This is an info log");
logger.warn("This is a warning");
logger.error("This is an error");
```

### `requestLogger`: Request Logger Middleware

Use this as a middleware for incoming requests

```typescript
const app = express();
app.use(requestLogger);
```

## Available Log Levels

- `error`
- `warn`
- `info` (default)
- `http`
- `verbose`
- `debug`
- `silly`

## Log file

- Log files are stored in logs folder of current working directory. Error logs are stored in files with format `error-%DATE%.log` and combined logs are stored with format `combined-%DATE%.log`.
- Log files have a 7 day rotation period defined.

## Configuration

- By default, the log level is set to `info`.
- You can specify a log level by adding a LOG_LEVEL in .env.
