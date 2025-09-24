/* eslint-disable no-useless-catch */
import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane web root store
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { ConnectionService } from "@plane/etl/core";
import { E_INTEGRATION_KEYS, TWorkspaceUserConnection } from "@plane/types";
import { RootStore } from "@/plane-web/store/root.store";
import { IIntegrationBaseStore, IntegrationBaseStore } from ".";

export interface IConnectionStore extends IIntegrationBaseStore {
  // observables
  userConnections: Record<string, TWorkspaceUserConnection[]>; // workspaceSlug -> user connections
  // helper actions
  getConnectionsByWorkspaceSlug: (workspaceSlug: string) => TWorkspaceUserConnection[] | undefined;
  // actions
  fetchUserConnections: (
    workspaceId?: string,
    workspaceSlug?: string
  ) => Promise<TWorkspaceUserConnection[] | undefined>;
}

export class ConnectionStore extends IntegrationBaseStore implements IConnectionStore {
  // observables
  userConnections: Record<string, TWorkspaceUserConnection[]> = {};
  connectionService: ConnectionService;

  constructor(protected store: RootStore) {
    super(store);
    makeObservable(this, {
      // observables
      userConnections: observable,
      // actions
      fetchUserConnections: action,
    });

    this.connectionService = new ConnectionService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  /**
   * @description get connections by workspace slug
   * @param { string } workspaceSlug
   * @returns { TUserWorkspaceConnection<any>[] | undefined }
   */
  getConnectionsByWorkspaceSlug = (workspaceSlug: string): TWorkspaceUserConnection[] | undefined => {
    const connections = this.userConnections[workspaceSlug];
    return (connections || []).reduce((allConnections: any, connection: any) => {
      if (connection.connectionType !== E_INTEGRATION_KEYS.GITLAB) {
        allConnections.push(connection);
      }
      return allConnections;
    }, []);
  };

  /**
   * @description get user connections
   * @param { string } workspaceId
   * @returns { TUserWorkspaceConnection<any>[] | undefined }
   */
  fetchUserConnections = async (
    workspaceId?: string,
    workspaceSlug?: string
  ): Promise<TWorkspaceUserConnection[] | undefined> => {
    const workspace_id = workspaceId ?? this.store.workspaceRoot.currentWorkspace?.id;
    const workspace_slug = workspaceSlug ?? this.store.workspaceRoot.currentWorkspace?.slug;
    const user_id = this.store.user.data?.id;

    if (!workspace_id || !workspace_slug || !user_id) return undefined;

    try {
      const userConnections = await this.connectionService.getUserConnections(workspace_id, user_id);
      if (userConnections) {
        runInAction(() => {
          set(this.userConnections, [workspace_slug], userConnections);
        });
      }
      return userConnections;
    } catch (error) {
      throw error;
    }
  };
}
