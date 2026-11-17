# @plane/decorators

A lightweight TypeScript decorator library for building Express.js controllers with a clean, declarative syntax.

## Features

- TypeScript-first design
- Decorators for HTTP methods (GET, POST, PUT, PATCH, DELETE)
- WebSocket support (with `express-ws`)
- Middleware support
- Built with tsdown to `dist/` (`pnpm --filter=@plane/decorators build`)

## Installation

This package is part of the Plane workspace and can be used by adding it to your project's dependencies:

```json
{
  "dependencies": {
    "@plane/decorators": "workspace:*"
  }
}
```

The decorators use legacy TypeScript decorators and `reflect-metadata`, so the consuming project needs `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` in its `tsconfig.json`.

## Usage

### Basic REST Controller

```typescript
import { Controller, Get, Post, registerController } from "@plane/decorators";
import { Router, type Request, type Response } from "express";

@Controller("/api/users")
class UserController {
  @Get("/")
  async getUsers(req: Request, res: Response) {
    return res.json({ users: [] });
  }

  @Post("/")
  async createUser(req: Request, res: Response) {
    return res.json({ success: true });
  }
}

// Register routes
const router = Router();
registerController(router, UserController);
```

### WebSocket Controller

```typescript
import express, { Router, type Request } from "express";
import expressWs from "express-ws";
import type { WebSocket as WS } from "ws";
import { Controller, WebSocket, registerController } from "@plane/decorators";

@Controller("/ws/chat")
class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @WebSocket("/")
  handleConnection(ws: WS, req: Request) {
    ws.on("message", (message) => {
      ws.send(`Received: ${message}`);
    });
  }
}

// express-ws must patch the app before the router is created
const app = express();
expressWs(app);
const router = Router();

// Constructor arguments are passed as the third parameter
registerController(router, ChatController, [chatService]);
app.use(router);
```

`registerController` detects whether a class has `@WebSocket` methods and registers it as a WebSocket or REST controller. See `apps/live/src/server.ts` for real usage.

## API Reference

### Decorators

- `@Controller(baseRoute: string)` - Class decorator for defining a base route
- `@Get(route: string)` - Method decorator for HTTP GET endpoints
- `@Post(route: string)` - Method decorator for HTTP POST endpoints
- `@Put(route: string)` - Method decorator for HTTP PUT endpoints
- `@Patch(route: string)` - Method decorator for HTTP PATCH endpoints
- `@Delete(route: string)` - Method decorator for HTTP DELETE endpoints
- `@WebSocket(route: string)` - Method decorator for WebSocket endpoints
- `@Middleware(middleware: RequestHandler)` - Method decorator for applying middleware

### Functions

- `registerController(router: Router, Controller, dependencies: unknown[] = [])` - Instantiates the controller with `dependencies` and registers its routes on `router`

## License

This project is licensed under the [GNU Affero General Public License v3.0](../../LICENSE.txt).
