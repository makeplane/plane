import { observable, makeObservable, computed } from "mobx";
// types
import type {
  IWorkspaceLite,
  TProjectDetails,
  TPublishEntityType,
  TProjectPublishSettings,
  TProjectPublishViewProps,
} from "@plane/types";
// store
import type { CoreRootStore } from "../root.store";

export interface IPublishStore extends TProjectPublishSettings {
  // computed
  workspaceSlug: string | undefined;
  canComment: boolean;
  canReact: boolean;
  canVote: boolean;
}

export class PublishStore implements IPublishStore {
  // observables
  anchor: string | undefined;
  is_comments_enabled: boolean;
  created_at: string | undefined;
  created_by: string | undefined;
  entity_identifier: string | undefined;
  entity_name: TPublishEntityType | undefined;
  id: string | undefined;
  inbox: unknown;
  project: string | undefined;
  project_details: TProjectDetails | undefined;
  is_reactions_enabled: boolean;
  updated_at: string | undefined;
  updated_by: string | undefined;
  view_props: TProjectPublishViewProps | undefined;
  is_votes_enabled: boolean;
  workspace: string | undefined;
  workspace_detail: IWorkspaceLite | undefined;

  constructor(
    private store: CoreRootStore,
    publishSettings: TProjectPublishSettings
  ) {
    this.anchor = publishSettings.anchor;
    this.is_comments_enabled = publishSettings.is_comments_enabled;
    this.created_at = publishSettings.created_at;
    this.created_by = publishSettings.created_by;
    this.entity_identifier = publishSettings.entity_identifier;
    this.entity_name = publishSettings.entity_name;
    this.id = publishSettings.id;
    this.inbox = publishSettings.inbox;
    this.project = publishSettings.project;
    this.project_details = publishSettings.project_details;
    this.is_reactions_enabled = publishSettings.is_reactions_enabled;
    this.updated_at = publishSettings.updated_at;
    this.updated_by = publishSettings.updated_by;
    this.view_props = publishSettings.view_props;
    this.is_votes_enabled = publishSettings.is_votes_enabled;
    this.workspace = publishSettings.workspace;
    this.workspace_detail = publishSettings.workspace_detail;

    makeObservable(this, {
      // observables
      anchor: observable.ref,
      is_comments_enabled: observable.ref,
      created_at: observable.ref,
      created_by: observable.ref,
      entity_identifier: observable.ref,
      entity_name: observable.ref,
      id: observable.ref,
      inbox: observable,
      project: observable.ref,
      project_details: observable,
      is_reactions_enabled: observable.ref,
      updated_at: observable.ref,
      updated_by: observable.ref,
      view_props: observable,
      is_votes_enabled: observable.ref,
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
    return !!this.is_comments_enabled;
  }

  /**
   * @description returns whether reacting is enabled or not
   */
  get canReact() {
    return !!this.is_reactions_enabled;
  }

  /**
   * @description returns whether voting is enabled or not
   */
  get canVote() {
    return !!this.is_votes_enabled;
  }
}
