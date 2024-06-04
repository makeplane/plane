import { observable, makeObservable, computed } from "mobx";
// store types
import { RootStore } from "@/store/root.store";
// types
import { TProjectDetails, TViewDetails, TWorkspaceDetails } from "@/types/project";
import { TPublishSettings } from "@/types/publish";

export interface IPublishStore extends TPublishSettings {
  // computed
  workspaceSlug: string | undefined;
  canComment: boolean;
  canReact: boolean;
  canVote: boolean;
}

export class PublishStore implements IPublishStore {
  // observables
  anchor: string | undefined;
  comments: boolean;
  created_at: string | undefined;
  created_by: string | undefined;
  id: string | undefined;
  inbox: unknown;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  reactions: boolean;
  updated_at: string | undefined;
  updated_by: string | undefined;
  views: TViewDetails | undefined;
  votes: boolean;
  workspace: string | undefined;
  workspace_detail: TWorkspaceDetails | undefined;

  constructor(
    private store: RootStore,
    publishSettings: TPublishSettings
  ) {
    this.anchor = publishSettings.anchor;
    this.comments = publishSettings.comments;
    this.created_at = publishSettings.created_at;
    this.created_by = publishSettings.created_by;
    this.id = publishSettings.id;
    this.inbox = publishSettings.inbox;
    this.project = publishSettings.project;
    this.project_details = publishSettings.project_details;
    this.reactions = publishSettings.reactions;
    this.updated_at = publishSettings.updated_at;
    this.updated_by = publishSettings.updated_by;
    this.views = publishSettings.views;
    this.votes = publishSettings.votes;
    this.workspace = publishSettings.workspace;
    this.workspace_detail = publishSettings.workspace_detail;

    makeObservable(this, {
      // observables
      anchor: observable.ref,
      comments: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      id: observable.ref,
      inbox: observable,
      project: observable.ref,
      project_details: observable,
      reactions: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      views: observable,
      votes: observable.ref,
      workspace: observable.ref,
      workspace_detail: observable,
      // computed
      workspaceSlug: computed,
      canComment: computed,
      canReact: computed,
      canVote: computed,
    });
  }

  /**
   * @description returns the workspace slug from the workspace details
   */
  get workspaceSlug() {
    return this?.workspace_detail?.slug ?? undefined;
  }

  /**
   * @description returns whether commenting is enabled or not
   */
  get canComment() {
    return !!this.comments;
  }

  /**
   * @description returns whether reacting is enabled or not
   */
  get canReact() {
    return !!this.reactions;
  }

  /**
   * @description returns whether voting is enabled or not
   */
  get canVote() {
    return !!this.votes;
  }
}
