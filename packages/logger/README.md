# Logger Package

This package provides a logger and a request logger utility built using [Winston](https://github.com/winstonjs/winston). It offers customizable log levels using env and supports structured logging for general application logs and HTTP requests.

## Features

- Dynamic log level configuration using env.
- Pre-configured winston logger for general usage (`logger`).
- Request logger middleware (`loggerMiddleware`, built on express-winston) that logs incoming requests
- Shared Winston options (`loggerConfig`) if you need to build another logger

## Usage

### Adding as a package

Add this package as a dependency in package.json

```json
{
  "dependencies": {
    "@plane/logger": "workspace:*"
  }
}
```

### Importing the Logger

```typescript
import { logger, loggerMiddleware } from "@plane/logger";
```

### Usage

### `logger`: General Logger

Use this for general application logs.

```typescript
logger.info("This is an info log");
logger.warn("This is a warning");
logger.error("This is an error");
```

### `loggerMiddleware`: Request Logger Middleware

Use this as a middleware for incoming requests

```typescript
const app = express();
app.use(loggerMiddleware);
```

## Available Log Levels

- `error`
- `warn`
- `info` (default)
- `http`
- `verbose`
- `debug`
- `silly`

## Output

- Logs are written as JSON (with a timestamp) to the console (stdout). No log files are written; collect logs from the process or container output.

## Configuration

- By default, the log level is set to `info`.
- You can specify a log level by adding a LOG_LEVEL in .env.
