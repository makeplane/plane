import type Redis from "ioredis";
import type { Request } from "express";
import type WebSocket from "ws";
// plane imports
import { Controller, WebSocket as WSDecorator } from "@plane/decorators";
import { logger } from "@plane/logger";
// redis
import { redisManager } from "@/redis";
// auth
import { handleAuthentication } from "@/lib/auth";

type TokenPayload = {
  id?: string;
  cookie?: string;
};

type ConnectionParams = {
  projectId: string;
  workspaceSlug: string;
  token: string;
};

const getFirstQueryValue = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

const extractConnectionParams = (req: Request): ConnectionParams | null => {
  const query = req.query as Record<string, string | string[]>;
  const projectId = getFirstQueryValue(query.projectId);
  const workspaceSlug = getFirstQueryValue(query.workspaceSlug);
  const token = getFirstQueryValue(query.token);

  if (!projectId || !workspaceSlug || !token) {
    return null;
  }

  return { projectId, workspaceSlug, token };
};

const parseToken = (rawToken: string): TokenPayload | null => {
  try {
    const parsed: unknown = JSON.parse(rawToken);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as TokenPayload;
  } catch (error) {
    logger.error("Invalid token payload for issue events", error);
    return null;
  }
};

const closeSocket = (ws: WebSocket, code: number, reason: string) => {
  if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
    return;
  }

  try {
    ws.close(code, reason);
  } catch (error) {
    logger.error("Issue events websocket close failure", error);
  }
};

const ensureAuthenticated = async (ws: WebSocket, token: TokenPayload, req: Request) => {
  const cookie = token?.cookie || req.headers.cookie || "";
  if (cookie) {
    try {
      await handleAuthentication({
        cookie,
        userId: token?.id ?? "",
      });
      return true;
    } catch (error) {
      logger.error("Failed to authenticate issue events connection", error);
      closeSocket(ws, 4003, "Unauthorized");
      return false;
    }
  }

  if (!token?.id) {
    closeSocket(ws, 4003, "Unauthorized");
    return false;
  }

  return true;
};

@Controller("/issues")
export class IssueEventsController {
  @WSDecorator("/")
  async handleConnection(ws: WebSocket, req: Request) {
    const params = extractConnectionParams(req);
    if (!params) {
      closeSocket(ws, 4001, "Missing required parameters");
      return;
    }

    const tokenPayload = parseToken(params.token);
    if (!tokenPayload) {
      closeSocket(ws, 4002, "Invalid token");
      return;
    }

    const authenticated = await ensureAuthenticated(ws, tokenPayload, req);
    if (!authenticated) {
      return;
    }

    const redisClient = redisManager.getClient();
    if (!redisClient) {
      closeSocket(ws, 1011, "Realtime service unavailable");
      return;
    }

    let subscriber: Redis;
    try {
      subscriber = redisClient.duplicate();
    } catch (error) {
      logger.error("Failed to create issue events redis subscriber", error);
      closeSocket(ws, 1011, "Realtime service unavailable");
      return;
    }

    const channel = `issue_events:${params.projectId}`;
    let cleanupStarted = false;

    const cleanup = async () => {
      if (cleanupStarted) return;
      cleanupStarted = true;

      subscriber.removeAllListeners("message");
      subscriber.removeAllListeners("error");

      try {
        await subscriber.unsubscribe(channel);
      } catch (error) {
        logger.error("Failed to unsubscribe issue events channel", error);
      }

      try {
        subscriber.disconnect();
      } catch (error) {
        logger.error("Failed to disconnect issue events subscriber", error);
      }
    };

    try {
      subscriber.on("error", (error) => {
        logger.error("Issue events redis subscriber error", error);
        closeSocket(ws, 1011, "Realtime service unavailable");
        void cleanup();
      });

      await subscriber.connect();

      subscriber.on("message", (incomingChannel, message) => {
        if (incomingChannel === channel && ws.readyState === ws.OPEN) {
          ws.send(message);
        }
      });

      await subscriber.subscribe(channel);

      ws.on("close", () => {
        void cleanup();
      });

      ws.on("error", (error) => {
        logger.error("Issue events websocket error", error);
        closeSocket(ws, 1011, "Issue events websocket error");
        void cleanup();
      });
    } catch (error) {
      logger.error("Failed to subscribe to issue events channel", error);
      closeSocket(ws, 1011, "Subscription failure");
      void cleanup();
    }
  }
}
