import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { ProjectUpdateService } from "@/plane-web/services";
// types
import { TProjectUpdate, TProjectUpdateReaction } from "@/plane-web/types";
import { IUpdateCommentStore, ProjectUpdateCommentStore } from "./comment.store";
import { IProjectUpdatesReactionStore, ProjectUpdatesReactionStore } from "./update_reaction.store";

export interface IProjectUpdateStoreActions {
  fetchUpdates: (workspaceSlug: string, projectId: string) => Promise<TProjectUpdate[]>;
  createUpdate: (workspaceSlug: string, projectId: string, data: Partial<TProjectUpdate>) => Promise<TProjectUpdate>;
  patchUpdate: (
    workspaceSlug: string,
    projectId: string,
    linkId: string,
    data: Partial<TProjectUpdate>
  ) => Promise<TProjectUpdate>;
  removeUpdate: (workspaceSlug: string, projectId: string, updateId: string) => Promise<void>;
}

export interface IProjectUpdateStore extends IProjectUpdateStoreActions {
  // observables
  loader: boolean;
  updates: Record<string, string[]>;
  updatesMap: Record<string, TProjectUpdate>;
  reactions: IProjectUpdatesReactionStore;
  comments: IUpdateCommentStore;
  // helper methods
  getUpdatesByProjectId: (projectId: string) => string[] | undefined;
  getUpdateById: (updateId: string) => TProjectUpdate | undefined;
}

export class ProjectUpdateStore implements IProjectUpdateStore {
  // observables
  loader: boolean = true;
  updates: Record<string, string[]> = {};
  updatesMap: Record<string, TProjectUpdate> = {};
  reactionMap: Record<string, TProjectUpdateReaction> = {};

  // root store
  reactions: IProjectUpdatesReactionStore;
  comments: IUpdateCommentStore;

  // services
  updateService;

  constructor() {
    makeObservable(this, {
      // observables
      loader: observable,
      updates: observable,
      updatesMap: observable,
      // actions
      fetchUpdates: action,
    });
    // root store
    this.reactions = new ProjectUpdatesReactionStore();
    this.comments = new ProjectUpdateCommentStore(this.reactions);

    // services
    this.updateService = new ProjectUpdateService();
  }

  // helper methods
  getUpdatesByProjectId = (projectId: string) => {
    if (!projectId) return undefined;
    return this.updates[projectId] ?? undefined;
  };

  getUpdateById = (updateId: string) => {
    if (!updateId) return undefined;
    return this.updatesMap[updateId] ?? undefined;
  };

  addUpdates = (projectId: string, updates: TProjectUpdate[]) => {
    runInAction(() => {
      this.updates[projectId] = updates.map((update) => update.id);
      updates.forEach((update) => {
        set(this.updatesMap, update.id, update);
        this.reactions.addReactions(update.id, update.update_reactions);
      });
    });
  };

  fetchUpdates = async (workspaceSlug: string, projectId: string) => {
    const response = await this.updateService.getProjectUpdates(workspaceSlug, projectId);
    this.addUpdates(projectId, response);
    this.loader = false;

    return response;
  };

  createUpdate = async (workspaceSlug: string, projectId: string, data: Partial<TProjectUpdate>) => {
    const response = await this.updateService.createProjectUpdate(workspaceSlug, projectId, data);
    runInAction(() => {
      this.updates[projectId] = [response.id, ...this.updates[projectId]];
      set(this.updatesMap, response.id, response);
    });
    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  patchUpdate = async (workspaceSlug: string, projectId: string, updateId: string, data: Partial<TProjectUpdate>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.updatesMap, [updateId, key], data[key as keyof TProjectUpdate]);
      });
    });

    const response = await this.updateService.updateProjectUpdate(workspaceSlug, projectId, updateId, data);

    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  removeUpdate = async (workspaceSlug: string, projectId: string, updateId: string) => {
    await this.updateService.deleteProjectUpdate(workspaceSlug, projectId, updateId);

    const updateIndex = this.updates[projectId].findIndex((_update) => _update === updateId);
    if (updateIndex >= 0)
      runInAction(() => {
        this.updates[projectId].splice(updateIndex, 1);
        delete this.updatesMap[updateId];
      });

    // fetching activity
    // this.rootProjectDetailStore.activity.fetchActivities(workspaceSlug, projectId);
  };
}
