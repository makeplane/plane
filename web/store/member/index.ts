import { action, makeObservable, observable } from "mobx";
// types
import { IUserLite } from "@plane/types";
import { RootStore } from "@/store/root.store";
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

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
      // computed actions
      getUserDetails: action,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get user details rom userId
   * @param userId
   */
  getUserDetails = (userId: string): IUserLite | undefined => this.memberMap?.[userId] ?? undefined;
}
