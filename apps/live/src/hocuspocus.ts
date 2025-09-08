import { Server, Hocuspocus } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
// env
import { env } from "@/env";
// extensions
import { extensions } from "@/extensions";
// lib
import { onAuthenticate, onStateless } from "@/lib/auth";

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
   * Initialize and configure the HocusPocus server
   */
  public async initialize(): Promise<Hocuspocus> {
    if (this.isInitialized && this.server) {
      return this.server;
    }

    this.server = Server.configure({
      name: this.serverName,
      onAuthenticate: onAuthenticate,
      onStateless: onStateless,
      extensions,
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
