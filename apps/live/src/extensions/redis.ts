import { Redis as HocuspocusRedis } from "@hocuspocus/extension-redis";
import { OutgoingMessage } from "@hocuspocus/server";
import type { onConfigurePayload } from "@hocuspocus/server";
import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
import { redisManager } from "@/redis";
import { AdminCommand } from "@/types/admin-commands";
import type { AdminCommandData, AdminCommandHandler } from "@/types/admin-commands";

const getRedisClient = () => {
  const redisClient = redisManager.getClient();
  if (!redisClient) {
    throw new AppError("Redis client not initialized");
  }
  return redisClient;
};

export class Redis extends HocuspocusRedis {
  private adminHandlers = new Map<AdminCommand, AdminCommandHandler>();
  private readonly ADMIN_CHANNEL = "hocuspocus:admin";

  constructor() {
    super({ redis: getRedisClient() });
  }

  async onConfigure(payload: onConfigurePayload) {
    await super.onConfigure(payload);

    // Subscribe to admin channel
    await new Promise<void>((resolve, reject) => {
      this.sub.subscribe(this.ADMIN_CHANNEL, (error: Error) => {
        if (error) {
          logger.error(`[Redis] Failed to subscribe to admin channel:`, error);
          reject(error);
        } else {
          logger.info(`[Redis] Subscribed to admin channel: ${this.ADMIN_CHANNEL}`);
          resolve();
        }
      });
    });

    // Listen for admin messages
    this.sub.on("message", this.handleAdminMessage);
    logger.info(`[Redis] Attached admin message listener`);
  }

  private handleAdminMessage = async (channel: string, message: string) => {
    if (channel !== this.ADMIN_CHANNEL) return;

    try {
      const data = JSON.parse(message) as AdminCommandData;

      // Validate command
      if (!data.command || !Object.values(AdminCommand).includes(data.command as AdminCommand)) {
        logger.warn(`[Redis] Invalid admin command received: ${data.command}`);
        return;
      }

      const handler = this.adminHandlers.get(data.command);

      if (handler) {
        await handler(data);
      } else {
        logger.warn(`[Redis] No handler registered for admin command: ${data.command}`);
      }
    } catch (error) {
      logger.error("[Redis] Error handling admin message:", error);
    }
  };

  /**
   * Register handler for an admin command
   */
  public onAdminCommand<T extends AdminCommandData = AdminCommandData>(
    command: AdminCommand,
    handler: AdminCommandHandler<T>
  ) {
    this.adminHandlers.set(command, handler as AdminCommandHandler);
    logger.info(`[Redis] Registered admin command: ${command}`);
  }

  /**
   * Publish admin command to global channel
   */
  public async publishAdminCommand<T extends AdminCommandData>(data: T): Promise<number> {
    // Validate command data
    if (!data.command || !Object.values(AdminCommand).includes(data.command)) {
      throw new AppError(`Invalid admin command: ${data.command}`);
    }

    const message = JSON.stringify(data);
    const receivers = await this.pub.publish(this.ADMIN_CHANNEL, message);

    logger.info(`[Redis] Published "${data.command}" command, received by ${receivers} server(s)`);
    return receivers;
  }

  async onDestroy() {
    // Unsubscribe from admin channel
    await new Promise<void>((resolve) => {
      this.sub.unsubscribe(this.ADMIN_CHANNEL, (error: Error) => {
        if (error) {
          logger.error(`[Redis] Error unsubscribing from admin channel:`, error);
        }
        resolve();
      });
    });

    // Remove the message listener to prevent memory leaks
    this.sub.removeListener("message", this.handleAdminMessage);
    logger.info(`[Redis] Removed admin message listener`);

    await super.onDestroy();
  }

  /**
   * Broadcast a message to a document across all servers via Redis.
   * Uses empty identifier so ALL servers process the message.
   */
  public async broadcastToDocument(documentName: string, payload: unknown): Promise<number> {
    const stringPayload = typeof payload === "string" ? payload : JSON.stringify(payload);

    const message = new OutgoingMessage(documentName).writeBroadcastStateless(stringPayload);

    const emptyPrefix = Buffer.concat([Buffer.from([0])]);
    const channel = this["pubKey"](documentName);
    const encodedMessage = Buffer.concat([emptyPrefix, Buffer.from(message.toUint8Array())]);

    const result = await this.pub.publishBuffer(channel, encodedMessage);

    logger.info(`REDIS_EXTENSION: Published to ${documentName}, ${result} subscribers`);

    return result;
  }
}
