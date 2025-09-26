import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { TClickUpFolder, TClickUpSpace, TClickUpStatus, TClickUpTeam, TClickUpPriority } from "@plane/etl/clickup";
import { IAdditionalUsersResponse } from "@plane/types";
// plane web services
import { ClickUpDataService } from "@/plane-web/services/importers/clickup";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";

export interface IClickUpDataStore {
  // observables
  isLoading: boolean;
  error: object;
  clickUpTeams: Record<string, TClickUpTeam>; // teamId -> team
  clickUpSpaces: Record<string, TClickUpSpace>; // spaceId -> space
  clickUpFolders: Record<string, Record<string, TClickUpFolder>>; // spaceId -> folderId -> folder
  clickUpStatuses: Record<string, Record<string, TClickUpStatus>>; // folderId -> statusId -> status // it will also have list and space statuses
  clickUpPriorities: Record<string, Record<string, TClickUpPriority>>; // spaceId -> priorityId -> priority
  clickUpTaskCount: Record<string, number>; // folderId -> taskCount
  additionalUsersData: IAdditionalUsersResponse;
  // computed
  clickUpTeamIds: string[];
  clickUpSpaceIds: string[];
  getClickUpFolderIdsBySpaceId: (spaceId: string) => string[];
  // computed functions
  getClickUpTeamById: (teamId: string) => TClickUpTeam | undefined;
  getClickUpSpaceById: (spaceId: string) => TClickUpSpace | undefined;
  getClickUpFolderById: (spaceId: string, folderId: string) => TClickUpFolder | undefined;
  getClickUpStatusById: (folderId: string, statusId: string) => TClickUpStatus | undefined;
  getClickUpPriorityById: (spaceId: string, priorityId: string) => TClickUpPriority | undefined;
  getClickUpTaskCountByFolderId: (folderId: string) => number;
  getClickUpStatusIdsByFolderId: (folderId: string) => string[];
  getClickUpPriorityIdsBySpaceId: (spaceId: string) => string[];
  // actions
  fetchClickUpTeams: (workspaceId: string, userId: string) => Promise<TClickUpTeam[] | undefined>;
  fetchClickUpSpaces: (workspaceId: string, userId: string, teamId: string) => Promise<TClickUpSpace[] | undefined>;
  fetchClickUpFolders: (workspaceId: string, userId: string, spaceId: string) => Promise<TClickUpFolder[] | undefined>;
  fetchClickUpTaskCount: (workspaceId: string, userId: string, folderId: string) => Promise<number | undefined>;
  fetchClickUpAdditionalUsers: (
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ) => Promise<IAdditionalUsersResponse | undefined>;
}

export class ClickUpDataStore implements IClickUpDataStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  clickUpTeams: Record<string, TClickUpTeam> = {}; // teamId -> team
  clickUpSpaces: Record<string, TClickUpSpace> = {}; // spaceId -> space
  clickUpFolders: Record<string, Record<string, TClickUpFolder>> = {}; // spaceId -> folderId -> folder
  clickUpStatuses: Record<string, Record<string, TClickUpStatus>> = {}; // spaceId -> statusId -> status
  clickUpPriorities: Record<string, Record<string, TClickUpPriority>> = {}; // spaceId -> priorityId -> priority
  clickUpTaskCount: Record<string, number> = {}; // folderId -> taskCount
  additionalUsersData: IAdditionalUsersResponse = {
    additionalUserCount: 0,
    occupiedUserCount: 0,
  };
  // service
  service: ClickUpDataService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      clickUpTeams: observable,
      clickUpSpaces: observable,
      clickUpFolders: observable,
      clickUpStatuses: observable,
      clickUpPriorities: observable,
      clickUpTaskCount: observable,
      additionalUsersData: observable,
      // computed
      clickUpTeamIds: computed,
      clickUpSpaceIds: computed,
      // actions
      fetchClickUpTeams: action,
      fetchClickUpSpaces: action,
      fetchClickUpFolders: action,
      fetchClickUpTaskCount: action,
      fetchClickUpAdditionalUsers: action,
    });

    this.service = new ClickUpDataService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description Returns the list of team ids
   * @returns { string[] }
   */
  get clickUpTeamIds(): string[] {
    return Object.keys(this.clickUpTeams);
  }

  // computed functions
  /**
   * @description Returns the list of space ids by team id
   * @returns { string[] | undefined }
   */
  get clickUpSpaceIds(): string[] {
    const spaces = this.clickUpSpaces;
    if (!spaces) return [];
    return Object.keys(spaces);
  }

  /**
   * @description Returns the list of folder ids by space id
   * @returns { string[] | undefined }
   */
  getClickUpFolderIdsBySpaceId = computedFn((spaceId: string): string[] => {
    const folders = this.clickUpFolders;
    if (!folders || !folders[spaceId]) return [];
    return Object.keys(folders[spaceId]);
  });

  /**
   * @description Returns the list of status ids by folder id
   * @returns { string[] | undefined }
   */
  getClickUpStatusIdsByFolderId = computedFn((folderId: string): string[] => {
    const statuses = this.clickUpStatuses;
    if (!statuses || !statuses[folderId]) return [];
    return Object.keys(statuses[folderId]);
  });

  /**
   * @description Returns the list of priority ids by space id
   * @returns { string[] | undefined }
   */
  getClickUpPriorityIdsBySpaceId = computedFn((spaceId: string): string[] => {
    const priorities = this.clickUpPriorities;
    if (!priorities || !priorities[spaceId]) return [];
    return Object.keys(priorities[spaceId]);
  });

  /**
   * @description Returns the team by team id
   * @param { string } teamId
   * @returns { TClickUpTeam | undefined }
   */
  getClickUpTeamById = computedFn((teamId: string): TClickUpTeam | undefined => this.clickUpTeams?.[teamId]);

  /**
   * @description Returns the space by space id
   * @param { string } spaceId
   * @returns { TClickUpSpace | undefined }
   */
  getClickUpSpaceById = computedFn((spaceId: string): TClickUpSpace | undefined => this.clickUpSpaces?.[spaceId]);

  /**
   * @description Returns the folder by folder id
   * @param { string } folderId
   * @returns { TClickUpFolder | undefined }
   */
  getClickUpFolderById = computedFn(
    (spaceId: string, folderId: string): TClickUpFolder | undefined => this.clickUpFolders?.[spaceId]?.[folderId]
  );

  /**
   * @description Returns the status by status id
   * @param { string } statusId
   * @returns { TClickUpStatus | undefined }
   */
  getClickUpStatusById = computedFn(
    (folderId: string, statusId: string): TClickUpStatus | undefined => this.clickUpStatuses?.[folderId]?.[statusId]
  );

  /**
   * @description Returns the priority by priority id
   * @param { string } priorityId
   * @returns { TClickUpPriority | undefined }
   */
  getClickUpPriorityById = computedFn(
    (spaceId: string, priorityId: string): TClickUpPriority | undefined =>
      this.clickUpPriorities?.[spaceId]?.[priorityId]
  );

  /**
   * @description Returns the task count by folder id
   * @param { string } folderId
   * @returns { number | undefined }
   */
  getClickUpTaskCountByFolderId = computedFn((folderId: string): number => this.clickUpTaskCount[folderId] || 0);

  // actions
  /**
   * @description Fetches the list of ClickUp teams
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<TClickUpTeam[] | undefined> }
   */
  fetchClickUpTeams = async (workspaceId: string, userId: string): Promise<TClickUpTeam[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const teams = await this.service.getTeams(workspaceId, userId);

      runInAction(() => {
        if (teams) {
          teams.forEach((team) => {
            set(this.clickUpTeams, [team.id], team);
          });
        }
      });

      this.isLoading = false;
      return teams;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of ClickUp spaces
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } teamId
   * @returns { Promise<TClickUpSpace[] | undefined> }
   */
  fetchClickUpSpaces = async (
    workspaceId: string,
    userId: string,
    teamId: string
  ): Promise<TClickUpSpace[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const spaces = await this.service.getSpaces(workspaceId, userId, teamId);
      if (spaces) {
        runInAction(() => {
          spaces.forEach((space) => {
            set(this.clickUpSpaces, [space.id], space);

            // setting priorities
            if (space.features.priorities) {
              space.features.priorities.priorities.forEach((priority) => {
                set(this.clickUpPriorities, [space.id, priority.id], priority);
              });
            }
          });
        });
      }
      this.isLoading = false;
      return spaces;
    } catch (error) {
      console.log("error in fetchClickUpSpaces", error);
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of ClickUp folders
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } spaceId
   * @returns { Promise<TClickUpFolder[] | undefined> }
   */
  fetchClickUpFolders = async (
    workspaceId: string,
    userId: string,
    spaceId: string
  ): Promise<TClickUpFolder[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const folders = await this.service.getFolders(workspaceId, userId, spaceId);
      if (folders) {
        folders.forEach((folder) => {
          try {
            runInAction(() => {
              if (folder?.id) {
                // Initialize the space object if it doesn't exist
                if (!this.clickUpFolders[spaceId]) {
                  this.clickUpFolders[spaceId] = {};
                }

                // Set the folder directly instead of using lodash set
                this.clickUpFolders[spaceId][folder.id] = folder;
              }

              folder?.statuses?.forEach((status) => {
                if (folder?.id && status?.id) {
                  set(this.clickUpStatuses, [folder.id, status.id], status);
                }
              });

              const space = this.clickUpSpaces[spaceId];
              space?.statuses?.forEach((status) => {
                if (folder?.id && status?.id) {
                  set(this.clickUpStatuses, [folder.id, status.id], status);
                }
              });

              folder?.lists?.forEach((list) => {
                list?.statuses?.forEach((status) => {
                  if (folder?.id && status?.id) {
                    set(this.clickUpStatuses, [folder.id, status.id], status);
                  }
                });
              });
            });
          } catch (err) {
            console.error("Error processing folder", folder?.id, err);
          }
        });
      }
      this.isLoading = false;
      return folders;
    } catch (error) {
      console.log("error in fetchClickUpFolders", error);
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of ClickUp task count
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } folderId
   * @returns { Promise<number | undefined> }
   */
  fetchClickUpTaskCount = async (
    workspaceId: string,
    userId: string,
    folderId: string
  ): Promise<number | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const taskCountResponse = await this.service.getFolderTaskCount(workspaceId, userId, folderId);
      if (taskCountResponse) {
        runInAction(() => {
          this.clickUpTaskCount[folderId] = taskCountResponse.taskCount;
        });
      }
      this.isLoading = false;
      return taskCountResponse?.taskCount;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches additional users on import
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } workspaceSlug
   * @param { string } teamId
   * @returns { Promise<IAdditionalUsersResponse | undefined> }
   */
  fetchClickUpAdditionalUsers = async (
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ): Promise<IAdditionalUsersResponse | undefined> => {
    try {
      const additionalUserResponse = (await this.service.getAdditionalUsers(
        workspaceId,
        userId,
        workspaceSlug,
        teamId
      )) as IAdditionalUsersResponse;
      if (additionalUserResponse?.additionalUserCount) {
        runInAction(() => {
          this.additionalUsersData = additionalUserResponse;
        });
      }
      return additionalUserResponse;
    } catch (error) {
      this.error = error as unknown as object;
    }
  };
}
