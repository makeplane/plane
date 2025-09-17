import { TSlackUserAlertsConfig } from "@plane/etl/slack";
import { TWorkspaceConnection } from "@plane/types";
import { TSlackWorkspaceConnectionConfig } from "../types/types";

/*
 * The function takes the workspace connection and the plane user id
 * and returns the alert configuration for the user.
 */
export const extractSlackUserAlertsConfigFromWC = (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  planeUserId: string
): TSlackUserAlertsConfig | undefined => {
  const { config } = workspaceConnection;

  if (!config.alertsConfig) {
    return undefined;
  }

  return config.alertsConfig.dmAlerts?.[planeUserId];
};

/*
 * The function takes the workspace connection and the plane user id
 * and sets the alert configuration for the user.
 */
export const setSlackUserAlertsConfig = (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  planeUserId: string,
  userAlertsConfig: TSlackUserAlertsConfig
): TSlackWorkspaceConnectionConfig => {
  const { config } = workspaceConnection;

  if (!config.alertsConfig) {
    config.alertsConfig = { dmAlerts: {} };
  }

  if (!config.alertsConfig.dmAlerts) {
    config.alertsConfig.dmAlerts = {};
  }

  config.alertsConfig.dmAlerts[planeUserId] = userAlertsConfig;
  return config;
};
