import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import { Redis } from "@hocuspocus/extension-redis";
import { Server, Hocuspocus } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type { TUserDetails } from "@plane/editor";
import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
import { logger } from "@plane/logger";
// env
import { env } from "@/env";
// lib
import { fetchPageDescriptionBinary, updatePageDescription } from "@/lib/page";
// redis
import { redisManager } from "@/redis";
// services
import { UserService } from "@/services/user.service";
// types
import type { HocusPocusServerContext, TDocumentTypes } from "@/types";

export class HocusPocusServerManager {
  private static instance: HocusPocusServerManager | null = null;
  private server: Hocuspocus | null = null;
  private isInitialized: boolean = false;
  // server options
  private serverName = env.HOSTNAME || uuidv4();

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  /**
   * Get the singleton instance of HocusPocusServerManager
   */
  public static getInstance(): HocusPocusServerManager {
    if (!HocusPocusServerManager.instance) {
      HocusPocusServerManager.instance = new HocusPocusServerManager();
    }
    return HocusPocusServerManager.instance;
  }

  /**
   * Authenticate the user
   * @param requestHeaders - The request headers
   * @param context - The context
   * @param token - The token
   * @returns The authenticated user
   */
  private onAuthenticate = async ({ requestHeaders, context, token }: any) => {
    let cookie: string | undefined = undefined;
    let userId: string | undefined = undefined;

    // Extract cookie (fallback to request headers) and userId from token (for scenarios where
    // the cookies are not passed in the request headers)
    try {
      const parsedToken = JSON.parse(token) as TUserDetails;
      userId = parsedToken.id;
      cookie = parsedToken.cookie;
    } catch (error) {
      // If token parsing fails, fallback to request headers
      logger.error("Token parsing failed, using request headers:", error);
    } finally {
      // If cookie is still not found, fallback to request headers
      if (!cookie) {
        cookie = requestHeaders.cookie?.toString();
      }
    }

    if (!cookie || !userId) {
      throw new Error("Credentials not provided");
    }

    // set cookie in context, so it can be used throughout the ws connection
    (context as HocusPocusServerContext).cookie = cookie;

    try {
      const userService = new UserService();
      const user = await userService.currentUser(cookie);
      if (user.id !== userId) {
        throw new Error("Authentication unsuccessful!");
      }

      return {
        user: {
          id: user.id,
          name: user.display_name,
        },
      };
    } catch (_error) {
      throw Error("Authentication unsuccessful!");
    }
  };

  private onStateless = async ({ payload, document }: any) => {
    // broadcast the client event (derived from the server event) to all the clients so that they can update their state
    const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer].client;
    if (response) {
      document.broadcastStateless(response);
    }
  };

  private onDatabaseFetch = async ({ context, documentName: pageId, requestParameters }: any) => {
    try {
      const cookie = (context as HocusPocusServerContext).cookie;
      // query params
      const params = requestParameters;
      const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;
      // fetch document
      if (documentType === "project_page") {
        const data = await fetchPageDescriptionBinary(params, pageId, cookie);
        return data;
      }
      throw new Error(`Invalid document type ${documentType} provided.`);
    } catch (error) {
      logger.error("Error in fetching document", error);
      return null;
    }
  };

  private onDatabaseStore = async ({ context, state, documentName: pageId, requestParameters }: any) => {
    const cookie = (context as HocusPocusServerContext).cookie;
    try {
      // query params
      const params = requestParameters;
      const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;

      if (documentType === "project_page") {
        await updatePageDescription(params, pageId, state, cookie);
      }
    } catch (error) {
      logger.error("Error in updating document:", error);
    }
  };
  /**
   * Initialize and configure the HocusPocus server
   */
  public async initialize(): Promise<Hocuspocus> {
    if (this.isInitialized && this.server) {
      return this.server;
    }

    const redisClient = redisManager.getClient();
    if (!redisClient) {
      throw new Error("Redis client not initialized");
    }

    this.server = Server.configure({
      name: this.serverName,
      onAuthenticate: this.onAuthenticate,
      onStateless: this.onStateless,
      extensions: [
        new Logger({
          onChange: false,
          log: (message) => {
            logger.info(message);
          },
        }),
        new Database({
          fetch: this.onDatabaseFetch,
          store: this.onDatabaseStore,
        }),
        new Redis({
          redis: redisClient,
        }),
      ],
      debounce: 10000,
    });

    this.isInitialized = true;
    return this.server;
  }

  /**
   * Get the configured server instance
   */
  public getServer(): Hocuspocus | null {
    return this.server;
  }

  /**
   * Check if the server has been initialized
   */
  public isServerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    HocusPocusServerManager.instance = null;
  }
}
