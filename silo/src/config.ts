import { TIntegrationConfig } from "@plane/types";

// A singleton class that holds the configuration for the app
export class Config {
  private static integrationConfig: TIntegrationConfig = {};

  // Loads the configuration from the server
  static async loadConfig() {
    // Load the integration config from the server
  }
}
