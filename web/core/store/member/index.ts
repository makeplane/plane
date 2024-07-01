import { makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// type
import { IUserLite } from "@plane/types";
// store
import { CoreRootStore } from "../root.store";
import { IProjectMemberStore, ProjectMemberStore } from "./project-member.store";
import { IWorkspaceMemberStore, WorkspaceMemberStore } from "./workspace-member.store";

export interface IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite>;
  // computed actions
  getUserDetails: (userId: string) => IUserLite | undefined;
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite> = {};
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get user details rom userId
   * @param userId
   */
  getUserDetails = computedFn((userId: string): IUserLite | undefined => this.memberMap?.[userId] ?? undefined);
}
