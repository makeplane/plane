/* eslint-disable no-useless-catch */
import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane web root store
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { ConnectionService, TUserWorkspaceConnection } from "@plane/etl/core";
import { RootStore } from "@/plane-web/store/root.store";
import { IIntegrationBaseStore, IntegrationBaseStore } from ".";

export interface IConnectionStore extends IIntegrationBaseStore {
  // observables
  userConnections: Record<string, TUserWorkspaceConnection<any>[]>; // workspaceSlug -> user connections

  // helper actions
  getConnectionsByWorkspaceSlug: (workspaceSlug: string) => TUserWorkspaceConnection<any>[] | undefined;

  // actions
  fetchUserConnections: (
    workspaceId?: string,
    workspaceSlug?: string
  ) => Promise<TUserWorkspaceConnection<any>[] | undefined>;
}

export class ConnectionStore extends IntegrationBaseStore implements IConnectionStore {
  // observables
  userConnections: Record<string, TUserWorkspaceConnection<any>[]> = {};
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
  getConnectionsByWorkspaceSlug = (workspaceSlug: string): TUserWorkspaceConnection<any>[] | undefined =>
    this.userConnections[workspaceSlug];

  /**
   * @description get user connections
   * @param { string } workspaceId
   * @returns { TUserWorkspaceConnection<any>[] | undefined }
   */
  fetchUserConnections = async (
    workspaceId?: string,
    workspaceSlug?: string
  ): Promise<TUserWorkspaceConnection<any>[] | undefined> => {
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
