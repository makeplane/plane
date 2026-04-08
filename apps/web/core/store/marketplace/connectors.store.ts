/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { TConnector, TConnectorFormData } from "@plane/types";
import type { RootStore } from "@/plane-web/store/root.store";
import { ConnectorsService } from "@/services/integrations/connectors.service";
import type { TLoader } from "@plane/types";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

export interface IConnectorsStore {
  mostUsedConnectors: TConnector[];
  connectorsLoader: TLoader;
  connectorMap: Map<string, TConnector>; // connectorId -> connector
  workspaceConnectors: Map<string, string[]>; // workspaceSlug -> connectorIds
  getConnectorsByWorkspaceSlug: (workspaceSlug: string) => TConnector[];
  getMostUsedConnectors: () => TConnector[];
  getConnectedConnectorIds: (workspaceSlug: string) => string[];
  getConnectorById: (id: string) => TConnector | undefined;
  fetchConnectors: (workspaceSlug: string) => Promise<void>;
  createConnector: (workspaceSlug: string, connector: TConnectorFormData) => Promise<TConnector>;
  updateConnector: (workspaceSlug: string, id: string, connector: TConnectorFormData) => Promise<TConnector>;
  updateConnectorCredentials: (
    workspaceSlug: string,
    id: string,
    headers: { name: string; value: string }[]
  ) => Promise<TConnector>;
  connectConnector: (workspaceSlug: string, id: string, connector: TConnector) => Promise<void>;
  disconnectConnector: (workspaceSlug: string, id: string) => Promise<void>;
  deleteConnector: (workspaceSlug: string, id: string) => Promise<void>;
  fetchMostUsedConnectors: (workspaceSlug: string) => Promise<void>;
}

export class ConnectorsStore implements IConnectorsStore {
  connectorsLoader: TLoader = "init-loader";
  connectorMap: Map<string, TConnector> = new Map();
  workspaceConnectors: Map<string, string[]> = new Map();
  mostUsedConnectors: TConnector[] = [];
  connectorsService: ConnectorsService;
  constructor(protected store: RootStore) {
    makeObservable(this, {
      connectorMap: observable,
      mostUsedConnectors: observable,
      workspaceConnectors: observable,
      connectorsLoader: observable,
      fetchConnectors: action,
      createConnector: action,
      updateConnector: action,
      updateConnectorCredentials: action,
      connectConnector: action,
      disconnectConnector: action,
      deleteConnector: action,
      fetchMostUsedConnectors: action,
    });
    this.connectorsService = new ConnectorsService();
  }

  getConnectedConnectorIds = computedFn((workspaceSlug: string): string[] => {
    const workspaceConnectorIds = this.workspaceConnectors.get(workspaceSlug) ?? [];
    const result: string[] = [];
    for (const connectorId of workspaceConnectorIds) {
      const connector = this.connectorMap.get(connectorId);
      if (connector && connector.is_connected) result.push(connectorId);
    }
    return result;
  });

  getConnectorsByWorkspaceSlug = computedFn((workspaceSlug: string): TConnector[] => {
    const workspaceConnectorIds = this.workspaceConnectors.get(workspaceSlug) ?? [];
    const result: TConnector[] = [];
    for (const connectorId of workspaceConnectorIds) {
      const connector = this.connectorMap.get(connectorId);
      if (connector) result.push(connector);
    }
    return result;
  });

  getConnectorById = computedFn((id: string): TConnector | undefined => {
    const connector = this.connectorMap.get(id);
    return connector;
  });

  getMostUsedConnectors = computedFn(() => {
    return this.mostUsedConnectors;
  });

  fetchConnectors = async (workspaceSlug: string): Promise<void> => {
    this.connectorsLoader = "init-loader";
    try {
      const connectors = await this.connectorsService.listAll(workspaceSlug);
      runInAction(() => {
        connectors.forEach((connector) => {
          this.connectorMap.set(connector.id, connector);
        });
        this.workspaceConnectors.set(
          workspaceSlug,
          connectors.map((connector) => connector.id)
        );
      });
    } catch (error) {
      console.error("Failed to fetch connectors", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  createConnector = async (workspaceSlug: string, connector: TConnectorFormData): Promise<TConnector> => {
    try {
      this.connectorsLoader = "mutation";
      const response = await this.connectorsService.create(workspaceSlug, connector);
      runInAction(() => {
        this.connectorMap.set(response.id, response);
        this.workspaceConnectors.set(workspaceSlug, [
          ...(this.workspaceConnectors.get(workspaceSlug) ?? []),
          response.id,
        ]);
      });
      return response;
    } catch (error) {
      console.error("Failed to create connector", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  updateConnector = async (workspaceSlug: string, id: string, connector: TConnectorFormData): Promise<TConnector> => {
    try {
      this.connectorsLoader = "mutation";
      const response = await this.connectorsService.update(workspaceSlug, id, connector);
      runInAction(() => {
        this.connectorMap.set(response.id, response);
      });
      return response;
    } catch (error) {
      console.error("Failed to update connector", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  updateConnectorCredentials = async (
    workspaceSlug: string,
    id: string,
    headers: { name: string; value: string }[]
  ): Promise<TConnector> => {
    try {
      this.connectorsLoader = "mutation";
      const response = await this.connectorsService.updateCredentials(workspaceSlug, id, { headers });
      runInAction(() => {
        this.connectorMap.set(response.id, response);
      });
      return response;
    } catch (error) {
      console.error("Failed to update connector credentials", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  connectConnector = async (workspaceSlug: string, id: string, connector: TConnector): Promise<void> => {
    try {
      this.connectorsLoader = "mutation";
      await this.connectorsService.connect(workspaceSlug, id, connector);
      runInAction(() => {
        const connector = this.connectorMap.get(id);
        if (connector) {
          this.connectorMap.set(id, { ...connector, is_connected: true });
        }
      });
    } catch (error) {
      console.error("Failed to connect connector", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  disconnectConnector = async (workspaceSlug: string, id: string): Promise<void> => {
    try {
      this.connectorsLoader = "mutation";
      await this.connectorsService.disconnect(workspaceSlug, id);
      runInAction(() => {
        // use the entire response and reset the connector
        const connector = this.connectorMap.get(id);
        if (connector) {
          this.connectorMap.set(id, {
            ...connector,
            is_connected: false,
            is_configured: connector.authorization_type !== "header",
          });
        }
      });
    } catch (error) {
      console.error("Failed to disconnect connector", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  deleteConnector = async (workspaceSlug: string, id: string): Promise<void> => {
    try {
      this.connectorsLoader = "mutation";
      await this.connectorsService.destroy(workspaceSlug, id);
      runInAction(() => {
        this.connectorMap.delete(id);
        const workspaceConnectorIds = this.workspaceConnectors.get(workspaceSlug) ?? [];
        this.workspaceConnectors.set(
          workspaceSlug,
          workspaceConnectorIds.filter((connectorId) => connectorId !== id)
        );
      });
    } catch (error) {
      console.error("Failed to delete connector", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };

  fetchMostUsedConnectors = async (workspaceSlug: string): Promise<void> => {
    try {
      this.connectorsLoader = "mutation";
      const response = await this.connectorsService.listMostUsed(workspaceSlug);
      runInAction(() => {
        this.mostUsedConnectors = response;
      });
    } catch (error) {
      console.error("Failed to fetch most used connectors", error);
      throw error;
    } finally {
      runInAction(() => {
        this.connectorsLoader = "loaded";
      });
    }
  };
}
