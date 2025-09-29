import { E_INTEGRATION_KEYS } from "@plane/types";
import { OAuthStrategy } from "./types";

export class OAuthStrategyManager {
  private static instance: OAuthStrategyManager;
  private strategies: Map<E_INTEGRATION_KEYS, OAuthStrategy>;

  private constructor() {
    this.strategies = new Map();
  }

  public static getInstance(): OAuthStrategyManager {
    if (!OAuthStrategyManager.instance) {
      console.log("Creating new instance of OAuthStrategyManager");
      OAuthStrategyManager.instance = new OAuthStrategyManager();
    }
    return OAuthStrategyManager.instance;
  }

  public registerStrategy(type: E_INTEGRATION_KEYS, strategy: OAuthStrategy): void {
    this.strategies.set(type, strategy);
  }

  public getStrategy(type: E_INTEGRATION_KEYS): OAuthStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No OAuth strategy found for type: ${type}`);
    }
    return strategy;
  }

  public hasStrategy(type: E_INTEGRATION_KEYS): boolean {
    return this.strategies.has(type);
  }

  public getStrategies(): Map<E_INTEGRATION_KEYS, OAuthStrategy> {
    return this.strategies;
  }
}
